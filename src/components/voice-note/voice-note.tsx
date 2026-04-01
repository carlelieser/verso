import { Button, Card, Slider } from 'heroui-native';
import { Pause, Play } from 'lucide-react-native';
import React, { memo, useCallback } from 'react';
import { Text, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import { AudioWaveform } from '@/components/ui/audio-waveform';
import { ElevatedCard, type ElevatedCardProps } from '@/components/ui/elevated-card';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useVoicePlayer } from '@/hooks/use-voice-player';
import { formatDurationMs } from '@/utils/format-time';

interface EditModeProps extends Omit<ElevatedCardProps, 'children'> {
	readonly mode: 'edit';
	readonly isRecording: boolean;
	readonly durationMs: number;
	readonly amplitudes: readonly SharedValue<number>[];
	readonly hasRecording: boolean;
	readonly onRecord: () => void;
	readonly onStop: () => void;
	readonly onClear: () => void;
}

interface ReadOnlyModeProps extends Omit<ElevatedCardProps, 'children'> {
	readonly mode: 'read-only';
	readonly uri: string;
	readonly waveform?: readonly number[];
}

type VoiceNoteProps = EditModeProps | ReadOnlyModeProps;

function EditVoiceNote({
	isRecording,
	durationMs,
	amplitudes,
	hasRecording,
	onRecord,
	onStop,
	onClear,
	mode,
	...cardProps
}: EditModeProps): React.JSX.Element {
	void mode;
	const { muted, accent } = useThemeColors();

	return (
		<ElevatedCard {...cardProps}>
			<Card.Body className="gap-3">
				<View className="flex-row justify-between items-center gap-3">
					<AudioWaveform
						amplitudes={amplitudes}
						color={isRecording ? accent : muted}
						size={32}
					/>
					<Text className="text-sm text-muted text-right">
						{formatDurationMs(durationMs)}
					</Text>
				</View>
				<View className="flex-row items-center justify-end">
					{hasRecording ? (
						<Button variant="danger" size="sm" onPress={onClear}>
							<Button.Label>Clear</Button.Label>
						</Button>
					) : (
						<View />
					)}
					{hasRecording ? null : (
						<Button variant="ghost" size="sm" onPress={isRecording ? onStop : onRecord}>
							<Button.Label>{isRecording ? 'Stop' : 'Record'}</Button.Label>
						</Button>
					)}
				</View>
			</Card.Body>
		</ElevatedCard>
	);
}

interface PlaybackSliderProps {
	readonly currentTimeMs: number;
	readonly durationMs: number;
	readonly seekTo: (positionMs: number) => void;
}

const PlaybackSlider = memo(function PlaybackSlider({
	currentTimeMs,
	durationMs,
	seekTo,
}: PlaybackSliderProps): React.JSX.Element {
	const handleSeekEnd = useCallback(
		(value: number | number[]) => {
			seekTo(typeof value === 'number' ? value : value[0]!);
		},
		[seekTo],
	);

	return (
		<Slider
			value={currentTimeMs}
			minValue={0}
			maxValue={durationMs > 0 ? durationMs : 1}
			onChangeEnd={handleSeekEnd}
		>
			<Slider.Track>
				<Slider.Fill />
				<Slider.Thumb />
			</Slider.Track>
		</Slider>
	);
});

function ReadOnlyVoiceNote({
	uri,
	waveform,
	mode,
	...cardProps
}: ReadOnlyModeProps): React.JSX.Element {
	void mode;
	const { muted, accent, foreground } = useThemeColors();
	const { isPlaying, currentTimeMs, durationMs, amplitudes, togglePlayback, seekTo } =
		useVoicePlayer(uri, waveform);

	return (
		<ElevatedCard {...cardProps}>
			<Card.Body className="gap-2">
				<View className="flex-row items-center gap-3">
					<AudioWaveform
						amplitudes={amplitudes}
						color={isPlaying ? accent : muted}
						size={32}
					/>
					<Text className="text-sm text-muted ml-auto">
						{formatDurationMs(currentTimeMs)}
					</Text>
					<Button variant="ghost" isIconOnly size="sm" onPress={togglePlayback}>
						{isPlaying ? (
							<Pause size={18} color={foreground} />
						) : (
							<Play size={18} color={foreground} />
						)}
					</Button>
				</View>
				<PlaybackSlider
					currentTimeMs={currentTimeMs}
					durationMs={durationMs}
					seekTo={seekTo}
				/>
			</Card.Body>
		</ElevatedCard>
	);
}

export function VoiceNote(props: VoiceNoteProps): React.JSX.Element {
	if (props.mode === 'edit') {
		return <EditVoiceNote {...props} />;
	}
	return <ReadOnlyVoiceNote {...props} />;
}
