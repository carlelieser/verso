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
	const { accent, muted, surface, border } = useThemeColors();

	const hasEmotions = entry.emotions.length > 0;
	const hasMetadata = entry.location !== null || entry.weather !== null || hasEmotions;

	if (!hasMetadata) {
		return (
			<View style={{ marginBottom: 20 }}>
				<Text className="text-sm text-muted">{formatRelativeDate(entry.createdAt)}</Text>
			</View>
		);
	}

	return (
		<View
			style={{
				marginBottom: 20,
				padding: 16,
				borderRadius: 12,
				backgroundColor: surface,
				borderWidth: 1,
				borderColor: border,
				gap: 12,
			}}
		>
			<Text className="text-sm text-muted">{formatRelativeDate(entry.createdAt)}</Text>

			{entry.location !== null || entry.weather !== null ? (
				<View style={{ gap: 8 }}>
					{entry.location !== null ? (
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
							<MapPin size={14} color={muted} />
							<Text className="text-sm text-foreground">{entry.location.name}</Text>
						</View>
					) : null}

					{entry.weather !== null ? (
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
							<CloudSun size={14} color={muted} />
							<Text className="text-sm text-foreground">
								{Math.round(entry.weather.temperature)}°F {entry.weather.condition}
							</Text>
						</View>
					) : null}
				</View>
			) : null}

			{hasEmotions ? (
				<View style={{ gap: 8 }}>
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
						<Smile size={14} color={muted} />
						<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 }}>
							{entry.emotions.map((emotion) => (
								<View
									key={emotion.id}
									style={{
										paddingHorizontal: 10,
										paddingVertical: 4,
										borderRadius: 16,
										borderWidth: 1,
										borderColor: accent,
									}}
								>
									<Text style={{ fontSize: 12, color: accent }}>
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
