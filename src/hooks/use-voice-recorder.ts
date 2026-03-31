import { RecordingPresets, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { useCallback, useRef } from 'react';
import { type SharedValue, useSharedValue } from 'react-native-reanimated';

type RecorderStatus = 'idle' | 'recording' | 'recorded';

interface UseVoiceRecorderResult {
	readonly status: RecorderStatus;
	readonly durationMs: number;
	readonly uri: string | null;
	readonly amplitude: SharedValue<number>;
	readonly record: () => void;
	readonly stop: () => void;
	readonly clear: () => void;
}

export function useVoiceRecorder(): UseVoiceRecorderResult {
	const amplitude = useSharedValue(0);
	const statusRef = useRef<RecorderStatus>('idle');

	const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY, (status) => {
		if (status.isFinished) {
			statusRef.current = 'recorded';
		}
	});

	const recorderState = useAudioRecorderState(recorder, 100);

	// Derive status from recorder state + our ref
	const status: RecorderStatus = recorderState.isRecording ? 'recording' : statusRef.current;

	// Update amplitude from metering
	if (recorderState.metering !== undefined && recorderState.isRecording) {
		// metering is in dB (negative values), normalize to 0-1
		const db = recorderState.metering;
		const normalized = Math.max(0, Math.min(1, (db + 50) / 50));
		amplitude.value = normalized;
	} else if (!recorderState.isRecording) {
		amplitude.value = 0;
	}

	const record = useCallback(() => {
		statusRef.current = 'recording';
		recorder.record();
	}, [recorder]);

	const stop = useCallback(() => {
		recorder.stop();
		statusRef.current = 'recorded';
	}, [recorder]);

	const clear = useCallback(() => {
		statusRef.current = 'idle';
		amplitude.value = 0;
	}, [amplitude]);

	return {
		status,
		durationMs: recorderState.durationMillis,
		uri: recorder.uri,
		amplitude,
		record,
		stop,
		clear,
	};
}
