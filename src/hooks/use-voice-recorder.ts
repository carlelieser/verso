import { VoiceProcessor } from '@picovoice/react-native-voice-processor';
import {
	getRecordingPermissionsAsync,
	RecordingPresets,
	setAudioModeAsync,
	useAudioRecorder,
	useAudioRecorderState,
} from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { type SharedValue, useSharedValue, withTiming } from 'react-native-reanimated';

import { computeBarAmplitudes, WAVEFORM_BAR_COUNT } from '@/constants/audio';

const FRAME_LENGTH = 512;
const SAMPLE_RATE = 16000;
const PCM_16BIT_MAX = 32768;

type RecorderStatus = 'idle' | 'recording' | 'recorded';

interface UseVoiceRecorderResult {
	readonly status: RecorderStatus;
	readonly durationMs: number;
	readonly uri: string | null;
	readonly amplitudes: readonly SharedValue<number>[];
	readonly record: () => void;
	readonly stop: () => void;
	readonly clear: () => void;
}

export function useVoiceRecorder(): UseVoiceRecorderResult {
	const [manualStatus, setManualStatus] = useState<RecorderStatus>('idle');
	const [durationMs, setDurationMs] = useState(0);

	const amp0 = useSharedValue(0);
	const amp1 = useSharedValue(0);
	const amp2 = useSharedValue(0);
	const amp3 = useSharedValue(0);
	const amplitudes = useRef([amp0, amp1, amp2, amp3]).current;
	const recorder = useAudioRecorder(
		{ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true },
		(status) => {
			if (status.isFinished) {
				setManualStatus('recorded');
			}
		},
	);

	const recorderState = useAudioRecorderState(recorder, 100);

	const status: RecorderStatus = recorderState.isRecording ? 'recording' : manualStatus;

	useEffect(() => {
		if (!recorderState.isRecording) return;
		if (recorderState.durationMillis > 0) {
			setDurationMs(recorderState.durationMillis);
		}
	}, [recorderState.isRecording, recorderState.durationMillis]);

	useEffect(() => {
		const voiceProcessor = VoiceProcessor.instance;

		const frameListener = (frame: number[]) => {
			if (frame.length < WAVEFORM_BAR_COUNT) return;
			const bars = computeBarAmplitudes(frame, PCM_16BIT_MAX);
			for (let i = 0; i < WAVEFORM_BAR_COUNT; i++) {
				amplitudes[i]!.value = bars[i]!;
			}
		};

		voiceProcessor.addFrameListener(frameListener);

		return () => {
			voiceProcessor.removeFrameListener(frameListener);
		};
	}, [amplitudes]);

	const record = useCallback(async () => {
		const { granted } = await getRecordingPermissionsAsync();
		if (!granted) return;

		if (Platform.OS === 'ios') {
			await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
		}

		setDurationMs(0);
		for (const amp of amplitudes) {
			amp.value = 0;
		}

		await VoiceProcessor.instance.start(FRAME_LENGTH, SAMPLE_RATE);
		await recorder.prepareToRecordAsync();
		setManualStatus('recording');
		recorder.record();
	}, [recorder, amplitudes]);

	const stop = useCallback(async () => {
		recorder.stop();
		await VoiceProcessor.instance.stop();
		for (const amp of amplitudes) {
			amp.value = withTiming(0, { duration: 150 });
		}
		setManualStatus('recorded');
	}, [recorder, amplitudes]);

	const clear = useCallback(async () => {
		const isProcessorRecording = await VoiceProcessor.instance.isRecording();
		if (isProcessorRecording) {
			await VoiceProcessor.instance.stop();
		}
		setManualStatus('idle');
		setDurationMs(0);
		for (const amp of amplitudes) {
			amp.value = 0;
		}
	}, [amplitudes]);

	return {
		status,
		durationMs,
		uri: recorder.uri,
		amplitudes,
		record,
		stop,
		clear,
	};
}
