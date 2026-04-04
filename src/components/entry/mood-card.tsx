import React from 'react';
import { Text, View } from 'react-native';

import { EMOTION_LABELS } from '@/constants/emotions';
import type { EmotionRecord } from '@/types/emotion';

interface MoodCardProps {
	readonly emotions: readonly EmotionRecord[];
}

export function MoodCard({ emotions }: MoodCardProps): React.JSX.Element | null {
	if (emotions.length === 0) return null;

	return (
		<View className="flex-row flex-wrap gap-2">
			{emotions.map((emotion) => (
				<View
					key={emotion.id}
					className="pl-1 pr-2 py-1 flex-row items-center gap-1 rounded-full border border-accent"
				>
					<View
						className={'size-6 items-center justify-center rounded-full bg-foreground'}
					>
						<Text className={'text-xs font-bold text-background'}>
							{emotion.intensity}
						</Text>
					</View>
					<Text className="text-xs text-accent">{EMOTION_LABELS[emotion.category]}</Text>
				</View>
			))}
		</View>
	);
}
