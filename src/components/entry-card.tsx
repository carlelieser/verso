import React from 'react';
import { Pressable, View } from 'react-native';

import { Card } from 'heroui-native';

import type { EntryWithJournal } from '@/types/entry';
import { formatRelativeDate } from '@/utils/date';

interface EntryCardProps {
	readonly entry: EntryWithJournal;
	readonly onPress: () => void;
	readonly showJournalName?: boolean;
}

export function EntryCard({ entry, onPress, showJournalName = false }: EntryCardProps): React.JSX.Element {
	const preview = entry.contentText.slice(0, 120).trim();

	return (
		<Pressable onPress={onPress}>
			<Card>
				<Card.Body>
					<View>
						{showJournalName ? (
							<Card.Title className="text-xs font-medium text-accent">
								{entry.journalName}
							</Card.Title>
						) : null}
						<Card.Title className="font-editor text-sm mt-1" numberOfLines={2}>
							{preview || 'Empty entry'}
						</Card.Title>
						<View className="flex-row items-center justify-end mt-1">
							<Card.Description className="text-xs opacity-50">
								{formatRelativeDate(entry.createdAt)}
							</Card.Description>
						</View>
					</View>
				</Card.Body>
			</Card>
		</Pressable>
	);
}
