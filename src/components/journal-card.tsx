import { Card } from 'heroui-native';
import React from 'react';
import { Pressable, View } from 'react-native';

import { getJournalIcon } from '@/constants/journal-icons';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { Journal } from '@/types/journal';

interface JournalCardProps {
	readonly journal: Journal;
	readonly entryCount: number;
	readonly onPress: () => void;
}

export function JournalCard({ journal, entryCount, onPress }: JournalCardProps): React.JSX.Element {
	const { muted } = useThemeColors();
	const Icon = getJournalIcon(journal.icon);

	return (
		<Pressable onPress={onPress}>
			<Card>
				<Card.Body>
					<View className="flex-row items-center gap-3">
						<Icon size={20} color={muted} />
						<View className="flex-1">
							<Card.Title>{journal.name}</Card.Title>
							<Card.Description>
								{entryCount === 0
									? 'No entries'
									: `${entryCount} ${entryCount === 1 ? 'entry' : 'entries'}`}
							</Card.Description>
						</View>
					</View>
				</Card.Body>
			</Card>
		</Pressable>
	);
}
