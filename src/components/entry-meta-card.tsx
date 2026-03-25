import { CloudSun, MapPin, Smile } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

import { EMOTION_LABELS } from '@/constants/emotions';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { EntryDetail } from '@/types/entry';
import { formatRelativeDate } from '@/utils/date';

interface EntryMetaCardProps {
	readonly entry: EntryDetail;
}

export function EntryMetaCard({ entry }: EntryMetaCardProps): React.JSX.Element {
	const { accent, muted } = useThemeColors();

	const hasEmotions = entry.emotions.length > 0;
	const hasMetadata = entry.location !== null || entry.weather !== null || hasEmotions;

	if (!hasMetadata) {
		return (
			<View className="mb-5">
				<Text className="text-sm text-muted">{formatRelativeDate(entry.createdAt)}</Text>
			</View>
		);
	}

	return (
		<View className="mb-5 p-4 rounded-xl bg-surface border border-border gap-3">
			<Text className="text-sm text-muted">{formatRelativeDate(entry.createdAt)}</Text>

			{entry.location !== null || entry.weather !== null ? (
				<View className="gap-2">
					{entry.location !== null ? (
						<View className="flex-row items-center gap-2">
							<MapPin size={14} color={muted} />
							<Text className="text-sm text-foreground">{entry.location.name}</Text>
						</View>
					) : null}

					{entry.weather !== null ? (
						<View className="flex-row items-center gap-2">
							<CloudSun size={14} color={muted} />
							<Text className="text-sm text-foreground">
								{Math.round(entry.weather.temperature)}°F {entry.weather.condition}
							</Text>
						</View>
					) : null}
				</View>
			) : null}

			{hasEmotions ? (
				<View className="gap-2">
					<View className="flex-row items-center gap-2">
						<Smile size={14} color={muted} />
						<View className="flex-row flex-wrap gap-2 flex-1">
							{entry.emotions.map((emotion) => (
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
					</View>
				</View>
			) : null}
		</View>
	);
}
