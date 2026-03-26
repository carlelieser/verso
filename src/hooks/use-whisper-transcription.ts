import { Audio } from 'expo-av';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { initWhisper, type WhisperContext } from 'whisper.rn';
import { RealtimeTranscriber } from 'whisper.rn/src/realtime-transcription';
import { AudioPcmStreamAdapter } from 'whisper.rn/src/realtime-transcription/adapters/AudioPcmStreamAdapter';

const MODEL_ASSET: number = require('../../assets/models/ggml-tiny.en.bin');

type TranscriptionStatus = 'idle' | 'loading' | 'recording' | 'error';

interface UseWhisperTranscriptionResult {
	readonly status: TranscriptionStatus;
	readonly isRecording: boolean;
	readonly liveText: string;
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
			const { granted } = await Audio.requestPermissionsAsync();
			if (!granted) {
				setStatus('idle');
				return;
			}

			if (Platform.OS === 'ios') {
				await Audio.setAudioModeAsync({
					allowsRecordingIOS: true,
					playsInSilentModeIOS: true,
				});
			}

			completedSlicesRef.current = '';
			fullTextRef.current = '';
			lastSliceIndexRef.current = -1;
			setLiveText('');

			const ctx = await ensureContext();
			const audioStream = new AudioPcmStreamAdapter();
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

						// When a new slice starts, commit the previous slice's text
						if (event.sliceIndex !== lastSliceIndexRef.current && lastSliceIndexRef.current >= 0) {
							completedSlicesRef.current = completedSlicesRef.current + ' ' + currentSliceText;
						}
						lastSliceIndexRef.current = event.sliceIndex;

						const segments = event.data?.segments ?? [];
						currentSliceText = segments
							.map((s) => s.text)
							.filter((t) => !t.includes('[BLANK_AUDIO]'))
							.join('')
							.trim();

						const fullText = (completedSlicesRef.current + ' ' + currentSliceText).trim();
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
		setLiveText('');
		setStatus('idle');
	}, []);

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
		toggle,
	};
}
