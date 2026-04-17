import { useCallback, useEffect, useRef } from 'react';
import {
	AudioEncoding,
	type RealtimeAudioRecorder,
	RealtimeAudioRecorderModule,
} from 'react-native-realtime-audio';
import { type SharedValue, useSharedValue, withTiming } from 'react-native-reanimated';

import { computeBarAmplitudes, WAVEFORM_BAR_COUNT } from '@/constants/audio';
import { decodeBase64Pcm16 } from '@/utils/audio';

const SAMPLE_RATE = 16000;

interface UseAudioPcmStreamResult {
	readonly amplitudes: readonly SharedValue<number>[];
	readonly start: () => Promise<void>;
	readonly stop: () => Promise<void>;
}

export function useAudioPcmStream(): UseAudioPcmStreamResult {
	const amp0 = useSharedValue(0);
	const amp1 = useSharedValue(0);
	const amp2 = useSharedValue(0);
	const amp3 = useSharedValue(0);
	const amplitudes = useRef([amp0, amp1, amp2, amp3]).current;

	const recorderRef = useRef<RealtimeAudioRecorder | null>(null);

	useEffect(() => {
		const subscription = RealtimeAudioRecorderModule.addListener(
			'onAudioCaptured',
			(event: { audioBuffer: string }) => {
				const samples = decodeBase64Pcm16(event.audioBuffer);
				if (samples.length < WAVEFORM_BAR_COUNT) return;

				const bars = computeBarAmplitudes(samples);
				for (let i = 0; i < WAVEFORM_BAR_COUNT; i++) {
					amplitudes[i]!.value = bars[i]!;
				}
			},
		);

		return () => {
			subscription.remove();
		};
	}, [amplitudes]);

	const start = useCallback(async () => {
		if (recorderRef.current) return;

		const RecorderClass = (RealtimeAudioRecorderModule as unknown as { RealtimeAudioRecorder: new (config: object, arg: boolean) => RealtimeAudioRecorder }).RealtimeAudioRecorder;
		const recorder = new RecorderClass(
			{ sampleRate: SAMPLE_RATE, encoding: AudioEncoding.pcm16bitInteger, channelCount: 1 },
			false,
		);
		recorderRef.current = recorder;
		await recorder.startRecording();
	}, []);

	const stop = useCallback(async () => {
		if (!recorderRef.current) return;

		await recorderRef.current.stopRecording();
		recorderRef.current = null;

		for (const amp of amplitudes) {
			amp.value = withTiming(0, { duration: 150 });
		}
	}, [amplitudes]);

	useEffect(() => {
		return () => {
			recorderRef.current?.stopRecording();
			recorderRef.current = null;
		};
	}, []);

	return { amplitudes, start, stop };
}
