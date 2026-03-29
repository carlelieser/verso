import { Card } from 'heroui-native';
import React from 'react';
import { Pressable, View } from 'react-native';

import type { EntryWithJournal } from '@/types/entry';
import { formatRelativeDate } from '@/utils/date';

interface EntryCardProps {
	readonly entry: EntryWithJournal;
	readonly onPress: () => void;
	readonly onLongPress?: () => void;
	readonly showJournalName?: boolean;
}

function countWords(text: string): number {
	const trimmed = text.trim();
	if (trimmed.length === 0) return 0;
	return trimmed.split(/\s+/).length;
}

function formatWordCount(count: number): string {
	if (count === 0) return 'Empty';
	if (count === 1) return '1 word';
	return `${count} words`;
}

export function EntryCard({
	entry,
	onPress,
	onLongPress,
	showJournalName = false,
}: EntryCardProps): React.JSX.Element {
	const preview = entry.contentText.slice(0, 120).trim();
	const wordCount = countWords(entry.contentText);

	const leftParts: string[] = [];
	if (showJournalName) leftParts.push(entry.journalName);
	leftParts.push(formatRelativeDate(entry.createdAt));

	return (
		<Pressable onPress={onPress} onLongPress={onLongPress}>
			<Card>
				<Card.Body>
					<View>
						<Card.Title className="font-editor text-sm" numberOfLines={2}>
							{preview || 'Empty entry'}
						</Card.Title>
						<View className="flex-row items-center justify-between mt-1">
							<Card.Description className="text-xs">
								{leftParts.join(' \u00B7 ')}
							</Card.Description>
							<Card.Description className="text-xs">
								{formatWordCount(wordCount)}
							</Card.Description>
						</View>
					</View>
				</Card.Body>
			</Card>
		</Pressable>
	);
}
