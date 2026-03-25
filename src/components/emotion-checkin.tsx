import { Button, Slider } from 'heroui-native';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { EMOTION_LABELS, EMOTIONS } from '@/constants/emotions';
import { useThemeColors } from '@/hooks/use-theme-colors';
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
	const { accent, accentForeground, foreground, muted, border } = useThemeColors();

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
		<View style={{ paddingTop: 28, paddingBottom: 48, gap: 24 }}>
			<View style={{ gap: 8, paddingHorizontal: 28 }}>
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
				contentContainerStyle={{ paddingHorizontal: 28 }}
			>
				<View style={{ gap: 8 }}>
					{rows.map((row, rowIdx) => (
						<View key={rowIdx} style={{ flexDirection: 'row', gap: 8 }}>
							{row.map((emotion) => {
								const isSelected = selected.has(emotion.key);
								return (
									<Pressable
										key={emotion.key}
										onPress={() => toggleEmotion(emotion.key)}
										style={{
											paddingHorizontal: 14,
											paddingVertical: 8,
											borderRadius: 20,
											backgroundColor: isSelected ? accent : 'transparent',
											borderWidth: 1,
											borderColor: isSelected ? accent : border,
										}}
									>
										<Text
											style={{
												fontSize: 13,
												fontWeight: isSelected ? '600' : '400',
												color: isSelected ? accentForeground : foreground,
											}}
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
				<View style={{ gap: 20, paddingHorizontal: 28 }}>
					<Text
						style={{
							fontSize: 11,
							fontWeight: '500',
							letterSpacing: 3,
							color: muted,
						}}
					>
						INTENSITY
					</Text>
					{selectedEmotions.map(([emotion, intensity]) => (
						<View key={emotion} style={{ gap: 10 }}>
							<View
								style={{
									flexDirection: 'row',
									justifyContent: 'space-between',
									alignItems: 'center',
								}}
							>
								<Text className="text-sm font-medium text-foreground">
									{EMOTION_LABELS[emotion]}
								</Text>
								<Text style={{ fontSize: 14, fontWeight: '600', color: accent }}>
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
