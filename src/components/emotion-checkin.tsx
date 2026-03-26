import { Button, Slider } from 'heroui-native';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { Overline } from '@/components/overline';
import { EMOTION_LABELS, EMOTIONS } from '@/constants/emotions';
import type { EmotionCategory, EmotionIntensity } from '@/types/common';
import { isEmotionIntensity } from '@/types/common';
import type { EmotionSelection } from '@/types/emotion';

const DEFAULT_INTENSITY: EmotionIntensity = 3;

interface EmotionCheckinProps {
	readonly onSave: (selections: readonly EmotionSelection[]) => void;
	/** Called on every selection/intensity change so the parent can persist state across unmounts. */
	readonly onChange?: (selections: readonly EmotionSelection[]) => void;
	readonly defaultSelections?: readonly EmotionSelection[];
}

export function EmotionCheckin({
	onSave,
	onChange,
	defaultSelections,
}: EmotionCheckinProps): React.JSX.Element {
	const [selected, setSelected] = useState<Map<EmotionCategory, EmotionIntensity>>(() => {
		if (!defaultSelections || defaultSelections.length === 0) return new Map();
		return new Map(defaultSelections.map((s) => [s.emotion, s.intensity]));
	});
	const emitChange = useCallback(
		(map: Map<EmotionCategory, EmotionIntensity>) => {
			if (!onChange) return;
			const selections = [...map.entries()].map(([emotion, intensity]) => ({
				emotion,
				intensity,
			}));
			onChange(selections);
		},
		[onChange],
	);

	const toggleEmotion = useCallback(
		(emotion: EmotionCategory) => {
			setSelected((prev) => {
				const next = new Map(prev);
				if (next.has(emotion)) {
					next.delete(emotion);
				} else {
					next.set(emotion, DEFAULT_INTENSITY);
				}
				emitChange(next);
				return next;
			});
		},
		[emitChange],
	);

	const updateIntensity = useCallback(
		(emotion: EmotionCategory, intensity: EmotionIntensity) => {
			setSelected((prev) => {
				const next = new Map(prev);
				next.set(emotion, intensity);
				emitChange(next);
				return next;
			});
		},
		[emitChange],
	);

	const selectedEmotions = [...selected.entries()];

	const NUM_ROWS = 4;
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
				contentContainerStyle={{ paddingHorizontal: 24 }}
			>
				<View className="gap-2">
					{rows.map((row, rowIdx) => (
						<View key={rowIdx} className="flex-row gap-2">
							{row.map((emotion) => {
								const isSelected = selected.has(emotion.key);
								return (
									<Pressable
										key={emotion.key}
										onPress={() => toggleEmotion(emotion.key)}
										className={`px-4 py-2 rounded-full border ${
											isSelected
												? 'bg-accent border-accent'
												: 'bg-transparent border-border'
										}`}
									>
										<Text
											className={`text-sm ${
												isSelected
													? 'font-semibold text-accent-foreground'
													: 'font-normal text-foreground'
											}`}
										>
											{emotion.label}
										</Text>
									</Pressable>
								);
							})}
						</View>
					))}
				</View>
			</ScrollView>

			{selectedEmotions.length > 0 ? (
				<View className="gap-5 px-6">
					<Overline>INTENSITY</Overline>
					{selectedEmotions.map(([emotion, intensity]) => (
						<View key={emotion} className="gap-2">
							<View className="flex-row justify-between items-center">
								<Text className="text-sm font-medium text-foreground">
									{EMOTION_LABELS[emotion]}
								</Text>
								<Text className="text-sm font-semibold text-accent">
									{intensity}
								</Text>
							</View>
							<Slider
								value={intensity}
								minValue={1}
								maxValue={5}
								step={1}
								onChange={(val) => {
									const rounded = Math.round(
										Array.isArray(val) ? (val[0] ?? DEFAULT_INTENSITY) : val,
									);
									if (isEmotionIntensity(rounded)) {
										updateIntensity(emotion, rounded);
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

			{selected.size > 0 ? (
				<View className="px-6 flex-row justify-end">
					<Button
						variant="secondary"
						onPress={() => {
							const selections = [...selected.entries()].map(
								([emotion, intensity]) => ({
									emotion,
									intensity,
								}),
							);
							onSave(selections);
						}}
					>
						<Button.Label>Done</Button.Label>
					</Button>
				</View>
			) : null}
		</View>
	);
}
