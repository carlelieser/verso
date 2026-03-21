import {
	AlertCircle,
	AlertTriangle,
	Flame,
	Frown,
	Heart,
	Moon,
	Smile,
	Sun,
	Wind,
	Zap,
} from 'lucide-react-native';
import React, {useCallback, useState} from 'react';
import {Pressable, Text, View} from 'react-native';
import {useCSSVariable} from 'uniwind';

import {Button, Slider} from 'heroui-native';

import type {EmotionCategory, EmotionIntensity} from '@/types/common';
import {EMOTION_LABELS} from '@/constants/emotions';

const EMOTION_ICONS: Record<EmotionCategory, React.ComponentType<{ size?: number; color?: string }>> = {
	happy: Smile,
	sad: Frown,
	anxious: AlertCircle,
	calm: Wind,
	frustrated: AlertTriangle,
	excited: Zap,
	grateful: Heart,
	angry: Flame,
	hopeful: Sun,
	tired: Moon,
};

const GRID_ROW_1: readonly EmotionCategory[] = ['happy', 'sad', 'anxious', 'calm', 'frustrated'];
const GRID_ROW_2: readonly EmotionCategory[] = ['excited', 'grateful', 'angry', 'hopeful', 'tired'];

interface EmotionSelection {
	readonly emotion: EmotionCategory;
	readonly intensity: EmotionIntensity;
}

interface EmotionCheckinProps {
	readonly onSave: (selections: readonly EmotionSelection[]) => void;
	readonly defaultSelections?: readonly EmotionSelection[];
}

export function EmotionCheckin({onSave, defaultSelections}: EmotionCheckinProps): React.JSX.Element {
	const [selected, setSelected] = useState<Map<EmotionCategory, EmotionIntensity>>(() => {
		if (!defaultSelections || defaultSelections.length === 0) return new Map();
		return new Map(defaultSelections.map((s) => [s.emotion, s.intensity]));
	});
	const [accent, accentForeground, foreground, muted, border] = useCSSVariable([
		'--color-accent',
		'--color-accent-foreground',
		'--color-foreground',
		'--color-muted',
		'--color-border',
	]);

	const toggleEmotion = useCallback((emotion: EmotionCategory) => {
		setSelected((prev) => {
			const next = new Map(prev);
			if (next.has(emotion)) {
				next.delete(emotion);
			} else {
				next.set(emotion, 3);
			}
			return next;
		});
	}, []);

	const updateIntensity = useCallback((emotion: EmotionCategory, intensity: EmotionIntensity) => {
		setSelected((prev) => {
			const next = new Map(prev);
			next.set(emotion, intensity);
			return next;
		});
	}, []);

	const renderChip = (emotion: EmotionCategory): React.JSX.Element => {
		const isSelected = selected.has(emotion);
		const Icon = EMOTION_ICONS[emotion];

		return (
			<Pressable
				key={emotion}
				onPress={() => toggleEmotion(emotion)}
				style={{
					width: 64,
					height: 72,
					borderRadius: 16,
					alignItems: 'center',
					justifyContent: 'center',
					gap: 4,
					backgroundColor: isSelected ? (accent as string) : 'transparent',
					borderWidth: 1,
					borderColor: isSelected ? (accent as string) : (border as string),
				}}
			>
				<Icon size={24} color={isSelected ? (accentForeground as string) : (muted as string)}/>
				<Text style={{
					fontSize: 9,
					fontWeight: isSelected ? '600' : '500',
					color: isSelected ? (accentForeground as string) : (muted as string),
				}}>
					{EMOTION_LABELS[emotion]}
				</Text>
			</Pressable>
		);
	};

	const selectedEmotions = [...selected.entries()];

	return (
		<View style={{padding: 28, paddingBottom: 48, gap: 24}}>
			<View style={{gap: 8}}>
				<Text className="text-3xl font-heading text-foreground pb-1">How are you feeling?</Text>
				<Text className="text-xs text-muted leading-5">
					Select all that apply. You can adjust the intensity for each.
				</Text>
			</View>

			<View style={{gap: 10}}>
				<View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
					{GRID_ROW_1.map(renderChip)}
				</View>
				<View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
					{GRID_ROW_2.map(renderChip)}
				</View>
			</View>

			{selectedEmotions.length > 0 ? (
				<View style={{gap: 20}}>
					<Text style={{
						fontSize: 11,
						fontWeight: '500',
						letterSpacing: 3,
						color: muted as string,
					}}>
						INTENSITY
					</Text>
					{selectedEmotions.map(([emotion, intensity]) => {
						const Icon = EMOTION_ICONS[emotion];
						return (
							<View key={emotion} style={{gap: 10}}>
								<View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
									<View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
										<Icon size={16} color={foreground as string}/>
										<Text className="text-sm font-medium text-foreground">
											{EMOTION_LABELS[emotion]}
										</Text>
									</View>
									<Text style={{fontSize: 14, fontWeight: '600', color: accent as string}}>
										{intensity}
									</Text>
								</View>
								<Slider
									value={intensity}
									minValue={1}
									maxValue={5}
									step={1}
									onChange={(val) => updateIntensity(emotion, Math.round(Array.isArray(val) ? val[0] ?? 3 : val) as EmotionIntensity)}
								>
									<Slider.Track>
										<Slider.Fill/>
										<Slider.Thumb/>
									</Slider.Track>
								</Slider>
							</View>
						);
					})}
				</View>
			) : null}

			{selected.size > 0 ? (
				<Button
					variant="primary"
					size="lg"
					onPress={() => {
						const selections = [...selected.entries()].map(([emotion, intensity]) => ({
							emotion,
							intensity,
						}));
						onSave(selections);
					}}
				>
					<Button.Label>Done</Button.Label>
				</Button>
			) : null}

		</View>
	);
}
