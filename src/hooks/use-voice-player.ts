import { useAudioPlayer, useAudioPlayerStatus, useAudioSampleListener } from 'expo-audio';
import { useCallback, useEffect, useRef } from 'react';
import { type SharedValue, useSharedValue, withTiming } from 'react-native-reanimated';

import { computeBarAmplitudes, WAVEFORM_BAR_COUNT } from '@/constants/audio';

interface UseVoicePlayerOptions {
	readonly updateIntervalMs?: number;
}

interface UseVoicePlayerResult {
	readonly isPlaying: boolean;
	readonly isFinished: boolean;
	readonly currentTimeMs: number;
	readonly durationMs: number;
	readonly amplitudes: readonly SharedValue<number>[];
	readonly togglePlayback: () => void;
	readonly seekTo: (positionMs: number) => void;
}

const DEFAULT_UPDATE_INTERVAL_MS = 1000;

export function useVoicePlayer(
	uri: string | null,
	options: UseVoicePlayerOptions = {},
): UseVoicePlayerResult {
	const { updateIntervalMs = DEFAULT_UPDATE_INTERVAL_MS } = options;
	const player = useAudioPlayer(uri ?? undefined, { updateInterval: updateIntervalMs });
	const status = useAudioPlayerStatus(player);

	const amp0 = useSharedValue(0);
	const amp1 = useSharedValue(0);
	const amp2 = useSharedValue(0);
	const amp3 = useSharedValue(0);
	const amplitudes = useRef([amp0, amp1, amp2, amp3]).current;

	useAudioSampleListener(player, (sample) => {
		const frames = sample.channels[0]?.frames;
		if (!frames || frames.length < WAVEFORM_BAR_COUNT) return;

		const bars = computeBarAmplitudes(frames);
		for (let i = 0; i < WAVEFORM_BAR_COUNT; i++) {
			amplitudes[i]!.value = bars[i]!;
		}
	});

	useEffect(() => {
		if (status.playing) return;
		const hasNonZero = amplitudes.some((amp) => amp.value > 0);
		if (!hasNonZero) return;
		for (const amp of amplitudes) {
			amp.value = withTiming(0, { duration: 150 });
		}
	}, [status.playing, amplitudes]);

	const isFinished =
		!status.playing && status.duration > 0 && status.currentTime >= status.duration;

	const togglePlayback = useCallback(async () => {
		if (status.playing) {
			player.pause();
		} else if (isFinished) {
			await player.seekTo(0);
			player.play();
		} else {
			player.play();
		}
	}, [player, status.playing, isFinished]);

	const seekTo = useCallback(
		async (positionMs: number) => {
			await player.seekTo(positionMs / 1000);
		},
		[player],
	);

	return {
		isPlaying: status.playing,
		isFinished,
		currentTimeMs: status.currentTime * 1000,
		durationMs: status.duration * 1000,
		amplitudes,
		togglePlayback,
		seekTo,
	};
}
