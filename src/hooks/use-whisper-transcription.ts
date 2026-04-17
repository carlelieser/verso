import { getRecordingPermissionsAsync, setAudioModeAsync } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { type SharedValue } from 'react-native-reanimated';
import { initWhisper, type WhisperContext } from 'whisper.rn';
import { RealtimeTranscriber } from 'whisper.rn/src/realtime-transcription';

import { useAudioPcmStream } from '@/hooks/use-audio-pcm-stream';
import { RealtimeAudioStreamAdapter } from '@/services/realtime-audio-stream-adapter';

const MODEL_ASSET: number = require('../../assets/models/ggml-tiny.en.bin');

type TranscriptionStatus = 'idle' | 'loading' | 'recording' | 'error';

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

	const pcmStream = useAudioPcmStream();

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
			const audioStream = new RealtimeAudioStreamAdapter();
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
			await pcmStream.start();
		} catch {
			setStatus('error');
		}
	}, [ensureContext, pcmStream]);

	const stopRecording = useCallback(async () => {
		await transcriberRef.current?.stop();
		transcriberRef.current = null;
		await pcmStream.stop();

		const text = fullTextRef.current.trim();
		if (text.length > 0) {
			onFinishRef.current(text);
		}

		completedSlicesRef.current = '';
		fullTextRef.current = '';
		lastSliceIndexRef.current = -1;
		setLiveText('');
		setStatus('idle');
	}, [pcmStream]);

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
		amplitudes: pcmStream.amplitudes,
		toggle,
	};
}
