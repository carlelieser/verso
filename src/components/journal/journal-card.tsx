import { Card } from 'heroui-native';
import React from 'react';
import { Pressable, View } from 'react-native';

import { JournalColorBanner } from '@/components/journal/journal-color-banner';
import { getJournalIcon } from '@/constants/journal-icons';
import type { Journal } from '@/types/journal';
import { formatJournalMeta } from '@/utils/format-journal-meta';

interface JournalCardProps {
	readonly journal: Journal;
	readonly className?: string;
	readonly entryCount: number;
	readonly isDefault?: boolean;
	readonly onPress: () => void;
	readonly onLongPress?: () => void;
}

export function JournalCard({
	journal,
	entryCount,
	isDefault,
	className = '',
	onPress,
	onLongPress,
}: JournalCardProps): React.JSX.Element {
	const Icon = getJournalIcon(journal.icon);

	return (
		<Pressable onPress={onPress} onLongPress={onLongPress}>
			<Card className={`p-0 ${className}`}>
				<JournalColorBanner color={journal.color} seed={journal.id} />
				<Card.Body className={'p-4'}>
					<View className="flex-row items-center gap-3">
						<Icon size={20} color={journal.color} />
						<View className="flex-1">
							<Card.Title>{journal.name}</Card.Title>
							<Card.Description className="text-xs">
								{formatJournalMeta(
									entryCount,
									isDefault ?? false,
									journal.isLocked,
								)}
							</Card.Description>
						</View>
					</View>
				</Card.Body>
			</Card>
		</Pressable>
	);
}
