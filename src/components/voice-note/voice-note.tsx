import { Button, Card, Slider } from 'heroui-native';
import { Pause, Play, RotateCcw } from 'lucide-react-native';
import React, { memo, useCallback, useRef, useState } from 'react';
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
	const isScrubbingRef = useRef(false);
	const [scrubValue, setScrubValue] = useState(0);

	const handleChange = useCallback((value: number | number[]) => {
		isScrubbingRef.current = true;
		setScrubValue(typeof value === 'number' ? value : value[0]!);
	}, []);

	const handleChangeEnd = useCallback(
		(value: number | number[]) => {
			const ms = typeof value === 'number' ? value : value[0]!;
			seekTo(ms);
			isScrubbingRef.current = false;
		},
		[seekTo],
	);

	return (
		<Slider
			value={isScrubbingRef.current ? scrubValue : currentTimeMs}
			minValue={0}
			maxValue={durationMs > 0 ? durationMs : 1}
			onChange={handleChange}
			onChangeEnd={handleChangeEnd}
		>
			<Slider.Track>
				<Slider.Fill />
				<Slider.Thumb />
			</Slider.Track>
		</Slider>
	);
});

function ReadOnlyVoiceNote({ uri, mode, ...cardProps }: ReadOnlyModeProps): React.JSX.Element {
	void mode;
	const { muted, accent, foreground } = useThemeColors();
	const { isPlaying, isFinished, currentTimeMs, durationMs, amplitudes, togglePlayback, seekTo } =
		useVoicePlayer(uri);

	const PlaybackIcon = isFinished ? RotateCcw : isPlaying ? Pause : Play;

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
						<PlaybackIcon size={18} color={foreground} />
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
