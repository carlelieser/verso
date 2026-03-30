import { Button, Slider } from 'heroui-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { Overline } from '@/components/ui/overline';
import { SelectablePill } from '@/components/ui/selectable-pill';
import { EMOTION_LABELS, EMOTIONS } from '@/constants/emotions';
import type { EmotionCategory, EmotionIntensity } from '@/types/common';
import { isEmotionIntensity } from '@/types/common';
import type { EmotionSelection } from '@/types/emotion';

const DEFAULT_INTENSITY: EmotionIntensity = 3;
const NUM_ROWS = 4;

interface EmotionCheckinProps {
	readonly onSave: (selections: readonly EmotionSelection[]) => void;
	readonly onChange?: (selections: readonly EmotionSelection[]) => void;
	readonly defaultSelections?: readonly EmotionSelection[];
}

export function EmotionCheckin({
	onSave,
	onChange,
	defaultSelections,
}: EmotionCheckinProps): React.JSX.Element {
	const [selections, setSelections] = useState<readonly EmotionSelection[]>(
		defaultSelections ?? [],
	);

	const emitChange = useCallback(
		(next: readonly EmotionSelection[]) => {
			onChange?.(next);
		},
		[onChange],
	);

	const toggleEmotion = useCallback(
		(emotion: EmotionCategory) => {
			setSelections((prev) => {
				const exists = prev.some((s) => s.emotion === emotion);
				return exists
					? prev.filter((s) => s.emotion !== emotion)
					: [...prev, { emotion, intensity: DEFAULT_INTENSITY }];
			});
		},
		[],
	);

	const updateIntensity = useCallback(
		(emotion: EmotionCategory, intensity: EmotionIntensity) => {
			setSelections((prev) =>
				prev.map((s) => (s.emotion === emotion ? { ...s, intensity } : s)),
			);
		},
		[],
	);

	// Emit changes outside the state updater to avoid side effects in StrictMode.
	// Skip the mount emission — the parent already knows the initial value.
	const hasMountedRef = useRef(false);
	useEffect(() => {
		if (!hasMountedRef.current) {
			hasMountedRef.current = true;
			return;
		}
		emitChange(selections);
	}, [selections, emitChange]);

	const selectedSet = useMemo(
		() => new Set(selections.map((s) => s.emotion)),
		[selections],
	);

	const rows = useMemo(() => {
		const result: (typeof EMOTIONS)[number][][] = Array.from({ length: NUM_ROWS }, () => []);
		for (let i = 0; i < EMOTIONS.length; i++) {
			result[i % NUM_ROWS]!.push(EMOTIONS[i]!);
		}
		return result;
	}, []);

	return (
		<View className="pt-6 pb-12 gap-6">
			<View className="gap-2 px-6">
				<Text className="text-3xl font-heading text-foreground pb-1">
					How are you feeling?
				</Text>
				<Text className="text-xs text-muted leading-5">
					Select all that apply. You can adjust the intensity for each.
				</Text>
			</View>

			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 12 }}
			>
				<View className="gap-2">
					{rows.map((row, rowIdx) => (
						<View key={rowIdx} className="flex-row gap-2">
							{row.map((emotion) => (
								<SelectablePill
									key={emotion.key}
									label={emotion.label}
									isSelected={selectedSet.has(emotion.key)}
									onPress={() => toggleEmotion(emotion.key)}
									className="px-4 py-2"
								/>
							))}
						</View>
					))}
				</View>
			</ScrollView>

			{selections.length > 0 ? (
				<View className="gap-5 px-6">
					<Overline>Intensity</Overline>
					{selections.map((selection) => (
						<View key={selection.emotion} className="gap-2">
							<View className="flex-row justify-between items-center">
								<Text className="text-sm font-medium text-foreground">
									{EMOTION_LABELS[selection.emotion]}
								</Text>
								<Text className="text-sm font-semibold text-accent">
									{selection.intensity}
								</Text>
							</View>
							<Slider
								value={selection.intensity}
								minValue={1}
								maxValue={5}
								step={1}
								onChange={(val) => {
									const rounded = Math.round(
										Array.isArray(val) ? (val[0] ?? DEFAULT_INTENSITY) : val,
									);
									if (isEmotionIntensity(rounded)) {
										updateIntensity(selection.emotion, rounded);
									}
								}}
							>
								<Slider.Track>
									<Slider.Fill />
									<Slider.Thumb />
								</Slider.Track>
							</Slider>
						</View>
					))}
				</View>
			) : null}

			{selections.length > 0 ? (
				<View className="px-6 flex-row justify-end">
					<Button variant="secondary" onPress={() => onSave(selections)}>
						<Button.Label>Done</Button.Label>
					</Button>
				</View>
			) : null}
		</View>
	);
}
