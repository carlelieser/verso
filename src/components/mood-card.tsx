import React from 'react';
import { Text, View } from 'react-native';

import { EMOTION_LABELS } from '@/constants/emotions';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { EmotionRecord } from '@/types/emotion';

interface MoodCardProps {
	readonly emotions: readonly EmotionRecord[];
}

export function MoodCard({ emotions }: MoodCardProps): React.JSX.Element | null {
	const { accent } = useThemeColors();

	if (emotions.length === 0) return null;

	return (
		<View className="p-3 rounded-xl bg-surface border border-border flex-row flex-wrap gap-2">
			{emotions.map((emotion) => (
				<View
					key={emotion.id}
					className="px-2 py-1 rounded-full border border-accent"
				>
					<Text className="text-xs text-accent">
						{EMOTION_LABELS[emotion.category]}
					</Text>
				</View>
			))}
		</View>
	);
}
