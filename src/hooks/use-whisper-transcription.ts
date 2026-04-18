import { getRecordingPermissionsAsync, setAudioModeAsync } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { type SharedValue, useSharedValue, withTiming } from 'react-native-reanimated';
import { initWhisper, type WhisperContext } from 'whisper.rn';
import { RealtimeTranscriber } from 'whisper.rn/src/realtime-transcription';

import { WAVEFORM_BAR_COUNT } from '@/constants/audio';
import { STT_MODEL_FILENAME } from '@/constants/settings';
import { RealtimeAudioStreamAdapter } from '@/services/realtime-audio-stream-adapter';

const MODEL_PATH = `${FileSystem.documentDirectory}models/${STT_MODEL_FILENAME}`;

type TranscriptionStatus = 'idle' | 'loading' | 'recording' | 'error' | 'unavailable';

interface UseWhisperTranscriptionResult {
	readonly status: TranscriptionStatus;
	readonly isRecording: boolean;
	readonly liveText: string;
	readonly amplitudes: readonly SharedValue<number>[];
	readonly toggle: () => void;
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
	const onFinishRef = useRef(onFinish);
	onFinishRef.current = onFinish;

	const amp0 = useSharedValue(0);
	const amp1 = useSharedValue(0);
	const amp2 = useSharedValue(0);
	const amp3 = useSharedValue(0);
	const amplitudes = useRef([amp0, amp1, amp2, amp3]).current;

	useEffect(() => {
		return () => {
			transcriberRef.current?.stop();
			transcriberRef.current?.release();
			contextRef.current?.release();
		};
	}, []);

	const ensureContext = useCallback(async (): Promise<WhisperContext | null> => {
		if (contextRef.current) return contextRef.current;
		const info = await FileSystem.getInfoAsync(MODEL_PATH);
		if (!info.exists) return null;
		const ctx = await initWhisper({ filePath: MODEL_PATH });
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
			if (!ctx) {
				setStatus('unavailable');
				return;
			}
			const audioStream = new RealtimeAudioStreamAdapter();
			audioStream.onRms((rms) => {
				for (let i = 0; i < WAVEFORM_BAR_COUNT - 1; i++) {
					amplitudes[i]!.value = amplitudes[i + 1]!.value;
				}
				amplitudes[WAVEFORM_BAR_COUNT - 1]!.value = Math.sqrt(rms);
			});
			let currentSliceText = '';

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
	}, [ensureContext, amplitudes]);

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
		for (const amp of amplitudes) {
			amp.value = withTiming(0, { duration: 150 });
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
