import { Button, Slider } from 'heroui-native';
import { Circle, Pause, Play, Square, Trash2 } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { Text, View } from 'react-native';
import { type SharedValue, useSharedValue } from 'react-native-reanimated';

import { AudioWaveform } from '@/components/ui/audio-waveform';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useVoicePlayer } from '@/hooks/use-voice-player';

function formatDuration(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

interface EditModeProps {
	readonly mode: 'edit';
	readonly isRecording: boolean;
	readonly durationMs: number;
	readonly amplitude: SharedValue<number>;
	readonly hasRecording: boolean;
	readonly onRecord: () => void;
	readonly onStop: () => void;
	readonly onClear: () => void;
}

interface ReadOnlyModeProps {
	readonly mode: 'read-only';
	readonly uri: string;
}

type VoiceNoteProps = EditModeProps | ReadOnlyModeProps;

function EditVoiceNote({
	isRecording,
	durationMs,
	amplitude,
	hasRecording,
	onRecord,
	onStop,
	onClear,
}: EditModeProps): React.JSX.Element {
	const { muted, accent, danger } = useThemeColors();

	return (
		<View className="gap-3 p-3 rounded-xl bg-surface border border-border">
			<View className="flex-row items-center gap-3">
				<AudioWaveform
					amplitudes={[amplitude]}
					color={isRecording ? accent : muted}
					size={24}
				/>
				<Text className="text-sm text-foreground flex-1 text-right">
					{formatDuration(durationMs)}
				</Text>
			</View>
			<View className="flex-row items-center justify-center gap-4">
				{hasRecording ? (
					<Button variant="ghost" isIconOnly onPress={onClear}>
						<Trash2 size={18} color={danger} />
					</Button>
				) : null}
				{isRecording ? (
					<Button variant="ghost" isIconOnly onPress={onStop}>
						<Square size={20} color={danger} />
					</Button>
				) : (
					<Button variant="ghost" isIconOnly onPress={onRecord}>
						<Circle size={20} color={danger} />
					</Button>
				)}
			</View>
		</View>
	);
}

function ReadOnlyVoiceNote({ uri }: ReadOnlyModeProps): React.JSX.Element {
	const { muted, accent, foreground } = useThemeColors();
	const { isPlaying, currentTimeMs, durationMs, togglePlayback, seekTo } = useVoicePlayer(uri);
	const staticAmplitude = useSharedValue(isPlaying ? 0.5 : 0);

	const handleSeek = useCallback(
		(value: number | number[]) => {
			seekTo(typeof value === 'number' ? value : value[0]!);
		},
		[seekTo],
	);

	return (
		<View className="gap-2 p-3 rounded-xl bg-surface border border-border">
			<View className="flex-row items-center gap-3">
				<AudioWaveform
					amplitudes={[staticAmplitude]}
					color={isPlaying ? accent : muted}
					size={24}
				/>
				<Text className="text-sm text-foreground flex-1">
					{formatDuration(currentTimeMs)}
				</Text>
				<Button variant="ghost" isIconOnly size="sm" onPress={togglePlayback}>
					{isPlaying ? (
						<Pause size={18} color={foreground} />
					) : (
						<Play size={18} color={foreground} />
					)}
				</Button>
			</View>
			<Slider
				value={currentTimeMs}
				minValue={0}
				maxValue={durationMs > 0 ? durationMs : 1}
				onChangeEnd={handleSeek}
			>
				<Slider.Track>
					<Slider.Fill />
					<Slider.Thumb />
				</Slider.Track>
			</Slider>
		</View>
	);
}

export function VoiceNote(props: VoiceNoteProps): React.JSX.Element {
	if (props.mode === 'edit') {
		return <EditVoiceNote {...props} />;
	}
	return <ReadOnlyVoiceNote {...props} />;
}
