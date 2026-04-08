import {
	getRecordingPermissionsAsync,
	RecordingPresets,
	setAudioModeAsync,
	useAudioRecorder,
	useAudioRecorderState,
} from 'expo-audio';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { type SharedValue } from 'react-native-reanimated';

import { useAudioPcmStream } from '@/hooks/use-audio-pcm-stream';

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

	const pcmStream = useAudioPcmStream();
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

	const record = useCallback(async () => {
		const { granted } = await getRecordingPermissionsAsync();
		if (!granted) return;

		if (Platform.OS === 'ios') {
			await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
		}

		setDurationMs(0);

		await pcmStream.start();
		await recorder.prepareToRecordAsync();
		setManualStatus('recording');
		recorder.record();
	}, [recorder, pcmStream]);

	const stop = useCallback(async () => {
		recorder.stop();
		await pcmStream.stop();
		setManualStatus('recorded');
	}, [recorder, pcmStream]);

	const clear = useCallback(async () => {
		await pcmStream.stop();
		setManualStatus('idle');
		setDurationMs(0);
	}, [pcmStream]);

	return {
		status,
		durationMs,
		uri: recorder.uri,
		amplitudes: pcmStream.amplitudes,
		record,
		stop,
		clear,
	};
}
