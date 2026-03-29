import { getRecordingPermissionsAsync, setAudioModeAsync } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { type SharedValue, useSharedValue } from 'react-native-reanimated';
import { initWhisper, type WhisperContext } from 'whisper.rn';
import { RealtimeTranscriber } from 'whisper.rn/src/realtime-transcription';
import { AudioPcmStreamAdapter } from 'whisper.rn/src/realtime-transcription/adapters/AudioPcmStreamAdapter';

const MODEL_ASSET: number = require('../../assets/models/ggml-tiny.en.bin');
const BAR_COUNT = 4;

type TranscriptionStatus = 'idle' | 'loading' | 'recording' | 'error';

interface UseWhisperTranscriptionResult {
	readonly status: TranscriptionStatus;
	readonly isRecording: boolean;
	readonly liveText: string;
	readonly amplitudes: readonly SharedValue<number>[];
	readonly toggle: () => void;
}

/** Compute normalized RMS amplitude (0–1) from 16-bit PCM samples. */
function computeAmplitude(pcm: Uint8Array): number {
	const sampleCount = Math.floor(pcm.length / 2);
	if (sampleCount === 0) return 0;

	let sum = 0;
	for (let i = 0; i < pcm.length - 1; i += 2) {
		const sample = ((pcm[i]! | (pcm[i + 1]! << 8)) << 16) >> 16; // Int16
		sum += sample * sample;
	}

	return Math.min(1, Math.sqrt(sum / sampleCount) / 16000);
}

export function useWhisperTranscription(
	onFinish: (text: string) => void,
): UseWhisperTranscriptionResult {
	const [status, setStatus] = useState<TranscriptionStatus>('idle');
	const [liveText, setLiveText] = useState('');
	const contextRef = useRef<WhisperContext | null>(null);
	const transcriberRef = useRef<RealtimeTranscriber | null>(null);
	const completedSlicesRef = useRef('');
	const fullTextRef = useRef('');
	const lastSliceIndexRef = useRef(-1);
	const barIndexRef = useRef(0);
	const onFinishRef = useRef(onFinish);
	onFinishRef.current = onFinish;

	const amp0 = useSharedValue(0);
	const amp1 = useSharedValue(0);
	const amp2 = useSharedValue(0);
	const amp3 = useSharedValue(0);
	const amplitudes: readonly SharedValue<number>[] = [amp0, amp1, amp2, amp3];

	useEffect(() => {
		return () => {
			transcriberRef.current?.stop();
			transcriberRef.current?.release();
			contextRef.current?.release();
		};
	}, []);

	const ensureContext = useCallback(async (): Promise<WhisperContext> => {
		if (contextRef.current) return contextRef.current;
		const ctx = await initWhisper({ filePath: MODEL_ASSET });
		contextRef.current = ctx;
		return ctx;
	}, []);

	const startRecording = useCallback(async () => {
		setStatus('loading');
		try {
			const { granted } = await getRecordingPermissionsAsync();
			if (!granted) {
				setStatus('idle');
				return;
			}

			if (Platform.OS === 'ios') {
				await setAudioModeAsync({
					allowsRecording: true,
					playsInSilentMode: true,
				});
			}

			completedSlicesRef.current = '';
			fullTextRef.current = '';
			lastSliceIndexRef.current = -1;
			setLiveText('');

			const ctx = await ensureContext();
			const audioStream = new AudioPcmStreamAdapter();
			let currentSliceText = '';

			// Intercept audio data for waveform visualization
			const originalOnData = audioStream.onData.bind(audioStream);
			audioStream.onData = (callback) => {
				originalOnData((data) => {
					callback(data);
					const level = computeAmplitude(data.data);
					const idx = barIndexRef.current % BAR_COUNT;
					amplitudes[idx]!.value = level;
					barIndexRef.current += 1;
				});
			};

			const transcriber = new RealtimeTranscriber(
				{ whisperContext: ctx, audioStream },
				{
					transcribeOptions: { language: 'en' },
					audioSliceSec: 30,
					audioMinSec: 1,
				},
				{
					onTranscribe: (event) => {
						if (event.type !== 'transcribe') return;

						// When a new slice starts, commit the previous slice's text
						if (
							event.sliceIndex !== lastSliceIndexRef.current &&
							lastSliceIndexRef.current >= 0
						) {
							completedSlicesRef.current =
								completedSlicesRef.current + ' ' + currentSliceText;
						}
						lastSliceIndexRef.current = event.sliceIndex;

						const segments = event.data?.segments ?? [];
						currentSliceText = segments
							.map((s) => s.text)
							.filter((t) => !t.includes('[BLANK_AUDIO]'))
							.join('')
							.trim();

						const fullText = (
							completedSlicesRef.current +
							' ' +
							currentSliceText
						).trim();
						fullTextRef.current = fullText;
						setLiveText(fullText);
					},
					onStatusChange: (isActive) => {
						setStatus(isActive ? 'recording' : 'idle');
					},
					onError: () => {
						setStatus('error');
					},
				},
			);

			transcriberRef.current = transcriber;
			await transcriber.start();
		} catch {
			setStatus('error');
		}
	}, [ensureContext]);

	const stopRecording = useCallback(async () => {
		await transcriberRef.current?.stop();
		transcriberRef.current = null;

		const text = fullTextRef.current.trim();
		if (text.length > 0) {
			onFinishRef.current(text);
		}

		completedSlicesRef.current = '';
		fullTextRef.current = '';
		lastSliceIndexRef.current = -1;
		barIndexRef.current = 0;
		for (const amp of amplitudes) {
			amp.value = 0;
		}
		setLiveText('');
		setStatus('idle');
	}, [amplitudes]);

	const toggle = useCallback(() => {
		if (status === 'recording') {
			stopRecording();
		} else if (status === 'idle' || status === 'error') {
			startRecording();
		}
	}, [status, startRecording, stopRecording]);

	return {
		status,
		isRecording: status === 'recording',
		liveText,
		amplitudes,
		toggle,
	};
}
