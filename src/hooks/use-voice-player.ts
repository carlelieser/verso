import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useCallback } from 'react';

interface UseVoicePlayerResult {
	readonly isPlaying: boolean;
	readonly currentTimeMs: number;
	readonly durationMs: number;
	readonly togglePlayback: () => void;
	readonly seekTo: (positionMs: number) => void;
}

export function useVoicePlayer(uri: string | null): UseVoicePlayerResult {
	const player = useAudioPlayer(uri ?? undefined);
	const status = useAudioPlayerStatus(player);

	const togglePlayback = useCallback(() => {
		if (status.playing) {
			player.pause();
		} else {
			player.play();
		}
	}, [player, status.playing]);

	const seekTo = useCallback(
		(positionMs: number) => {
			player.seekTo(positionMs / 1000);
		},
		[player],
	);

	return {
		isPlaying: status.playing,
		currentTimeMs: status.currentTime * 1000,
		durationMs: status.duration * 1000,
		togglePlayback,
		seekTo,
	};
}
