import { Button, Slider } from 'heroui-native';
import React, { useCallback, useEffect, useMemo } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Overline } from '@/components/ui/overline';
import { EMOTION_LABELS } from '@/constants/emotions';
import type { EmotionCategory, EmotionIntensity } from '@/types/common';
import { isEmotionIntensity } from '@/types/common';
import type { EmotionSelection } from '@/types/emotion';

interface EmotionIntensityListProps {
	readonly selections: readonly EmotionSelection[];
	readonly onIntensityChange: (emotion: EmotionCategory, intensity: EmotionIntensity) => void;
	readonly onDone: () => void;
	readonly onReset: () => void;
}

export function EmotionIntensityList({
	selections,
	onIntensityChange,
	onDone,
	onReset,
}: EmotionIntensityListProps): React.JSX.Element | null {
	const reversedSelections = useMemo(() => [...selections].reverse(), [selections]);

	if (selections.length === 0) return null;

	return (
		<>
			<View className="gap-5 px-6">
				<Overline>Emotions</Overline>
				{reversedSelections.map((selection) => (
					<EmotionIntensityRow
						key={selection.emotion}
						emotion={selection.emotion}
						intensity={selection.intensity}
						onIntensityChange={onIntensityChange}
					/>
				))}
			</View>

			<View className="px-6 flex-row justify-end gap-2">
				<Button variant="ghost" onPress={onReset}>
					<Button.Label>Reset</Button.Label>
				</Button>
				<Button variant="secondary" onPress={onDone}>
					<Button.Label>Done</Button.Label>
				</Button>
			</View>
		</>
	);
}

interface EmotionIntensityRowProps {
	readonly emotion: EmotionCategory;
	readonly intensity: EmotionIntensity;
	readonly onIntensityChange: (emotion: EmotionCategory, intensity: EmotionIntensity) => void;
}

const EmotionIntensityRow = React.memo(function EmotionIntensityRow({
	emotion,
	intensity,
	onIntensityChange,
}: EmotionIntensityRowProps): React.JSX.Element {
	const handleChange = useCallback(
		(val: number | number[]) => {
			const rounded = Math.round(Array.isArray(val) ? val[0] ?? 0 : val);
			if (isEmotionIntensity(rounded)) {
				onIntensityChange(emotion, rounded);
			}
		},
		[emotion, onIntensityChange],
	);

	const opacity = useSharedValue(intensity === 0 ? 0.35 : 1);

	useEffect(() => {
		opacity.value = withTiming(intensity === 0 ? 0.35 : 1, { duration: 200 });
	}, [intensity, opacity]);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
	}));

	return (
		<Animated.View className="gap-2" style={animatedStyle}>
			<View className="flex-row justify-between items-center">
				<Text className="text-sm font-medium text-foreground">
					{EMOTION_LABELS[emotion]}
				</Text>
				<Text className="text-sm font-semibold text-accent">{intensity}</Text>
			</View>
			<Slider value={intensity} minValue={0} maxValue={5} step={1} onChange={handleChange}>
				<Slider.Track>
					<Slider.Fill />
					<Slider.Thumb />
				</Slider.Track>
			</Slider>
		</Animated.View>
	);
});
