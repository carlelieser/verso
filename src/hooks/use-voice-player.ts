import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';
import { type SharedValue, useSharedValue, withTiming } from 'react-native-reanimated';

import { WAVEFORM_BAR_COUNT } from '@/constants/audio';

interface UseVoicePlayerResult {
	readonly isPlaying: boolean;
	readonly currentTimeMs: number;
	readonly durationMs: number;
	readonly amplitudes: readonly SharedValue<number>[];
	readonly togglePlayback: () => void;
	readonly seekTo: (positionMs: number) => void;
}

export function useVoicePlayer(
	uri: string | null,
	waveform?: readonly number[],
): UseVoicePlayerResult {
	const player = useAudioPlayer(uri ?? undefined);
	const status = useAudioPlayerStatus(player);

	const amp0 = useSharedValue(0);
	const amp1 = useSharedValue(0);
	const amp2 = useSharedValue(0);
	const amp3 = useSharedValue(0);
	const amplitudes = useRef([amp0, amp1, amp2, amp3]).current;

	useEffect(() => {
		if (!status.playing || !waveform || waveform.length === 0 || status.duration <= 0) {
			if (!status.playing) {
				for (const amp of amplitudes) {
					amp.value = withTiming(0, { duration: 150 });
				}
			}
			return;
		}

		const progress = status.currentTime / status.duration;
		const index = Math.min(Math.floor(progress * waveform.length), waveform.length - 1);

		for (let i = 0; i < WAVEFORM_BAR_COUNT; i++) {
			const sampleIndex = Math.min(index + i, waveform.length - 1);
			amplitudes[i]!.value = waveform[sampleIndex]!;
		}
	}, [status.playing, status.currentTime, status.duration, waveform, amplitudes]);

	const togglePlayback = useCallback(() => {
		if (status.playing) {
			player.pause();
		} else {
			player.play();
		}
	}, [player, status.playing]);

	const seekTo = useCallback(
		async (positionMs: number) => {
			await player.seekTo(positionMs / 1000);
		},
		[player],
	);

	const [throttledTimeMs, setThrottledTimeMs] = useState(0);
	const lastUpdateRef = useRef(0);

	useEffect(() => {
		const nowMs = status.currentTime * 1000;
		const now = Date.now();

		if (now - lastUpdateRef.current >= 1000) {
			lastUpdateRef.current = now;
			setThrottledTimeMs(nowMs);
		}
	}, [status.currentTime]);

	useEffect(() => {
		if (!status.playing) {
			setThrottledTimeMs(status.currentTime * 1000);
		}
	}, [status.playing, status.currentTime]);

	return {
		isPlaying: status.playing,
		currentTimeMs: throttledTimeMs,
		durationMs: status.duration * 1000,
		amplitudes,
		togglePlayback,
		seekTo,
	};
}
