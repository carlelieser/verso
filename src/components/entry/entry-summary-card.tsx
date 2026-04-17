import { router } from 'expo-router';
import { Chip } from 'heroui-native';
import React from 'react';
import { View } from 'react-native';

import { ATTACHMENT_TYPE_ICONS } from '@/constants/attachment-icons';
import { EMOTION_LABELS } from '@/constants/emotions';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { Attachment } from '@/types/attachment';
import type { EmotionSelection } from '@/types/emotion';

interface EntrySummaryCardProps {
	readonly journalId: string;
	readonly entryId: string;
	readonly emotions: readonly EmotionSelection[];
	readonly attachments: readonly Attachment[];
}

const PREVIEW_LIMIT = 3;

export function EntrySummaryCard({
	journalId,
	entryId,
	emotions,
	attachments,
}: EntrySummaryCardProps): React.JSX.Element {
	const { muted } = useThemeColors();
	const previewed = attachments.slice(0, PREVIEW_LIMIT);
	const overflow = attachments.length - PREVIEW_LIMIT;

	return (
		<View className="flex-row flex-wrap gap-2 mt-2">
			{emotions.map((e) => (
				<Chip key={e.emotion} size="sm" variant="soft" color="accent">
					<Chip.Label>{EMOTION_LABELS[e.emotion]}</Chip.Label>
				</Chip>
			))}
			{previewed.map((a) => {
				const Icon = ATTACHMENT_TYPE_ICONS[a.type];
				const label = a.type === 'location' ? a.data.name : a.data.fileName ?? 'Untitled';
				return (
					<Chip
						key={a.id}
						size="sm"
						variant="soft"
						color="default"
						onPress={() =>
							router.push(`/journal/${journalId}/entry/${entryId}/attachments`)
						}
					>
						<Icon size={12} color={muted} />
						<Chip.Label numberOfLines={1}>{label}</Chip.Label>
					</Chip>
				);
			})}
			{overflow > 0 ? (
				<Chip
					size="sm"
					variant="soft"
					color="default"
					onPress={() =>
						router.push(`/journal/${journalId}/entry/${entryId}/attachments`)
					}
				>
					<Chip.Label>+{overflow} more</Chip.Label>
				</Chip>
			) : null}
		</View>
	);
}
