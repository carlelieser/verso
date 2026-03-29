import { Card } from 'heroui-native';
import React from 'react';
import { Pressable, View } from 'react-native';

import { getJournalIcon } from '@/constants/journal-icons';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { Journal } from '@/types/journal';
import { formatJournalMeta } from '@/utils/format-journal-meta';

interface JournalCardProps {
	readonly journal: Journal;
	readonly entryCount: number;
	readonly isDefault?: boolean;
	readonly onPress: () => void;
	readonly onLongPress?: () => void;
}

export function JournalCard({
	journal,
	entryCount,
	isDefault,
	onPress,
	onLongPress,
}: JournalCardProps): React.JSX.Element {
	const { muted } = useThemeColors();
	const Icon = getJournalIcon(journal.icon);

	return (
		<Pressable onPress={onPress} onLongPress={onLongPress}>
			<Card>
				<Card.Body>
					<View className="flex-row items-center gap-3">
						<Icon size={20} color={muted} />
						<View className="flex-1">
							<Card.Title>{journal.name}</Card.Title>
							<Card.Description className="text-xs">
								{formatJournalMeta(entryCount, isDefault ?? false)}
							</Card.Description>
						</View>
					</View>
				</Card.Body>
			</Card>
		</Pressable>
	);
}
