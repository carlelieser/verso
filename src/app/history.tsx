import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Clock, Search, Trash2 } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionSheet, type ActionSheetItem } from '@/components/action-sheet';
import { AppDialog } from '@/components/app-dialog';
import { EmptyState } from '@/components/empty-state';
import { EntryCard } from '@/components/entry-card';
import { ScreenLayout } from '@/components/screen-layout';
import { SearchInput } from '@/components/search-input';
import { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { useDialog } from '@/hooks/use-dialog';
import { useEntries } from '@/hooks/use-entries';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { EntryWithJournal } from '@/types/entry';

export default function HistoryScreen(): React.JSX.Element {
	const insets = useSafeAreaInsets();
	const { muted } = useThemeColors();
	const [searchQuery, setSearchQuery] = useState('');
	const { entries, searchEntries, deleteEntry } = useEntries();
	const dialog = useDialog();
	const actionSheet = useBottomSheet();
	const [selectedEntry, setSelectedEntry] = useState<EntryWithJournal | null>(null);

	const handleSearch = useCallback(
		async (query: string) => {
			setSearchQuery(query);
			await searchEntries(query);
		},
		[searchEntries],
	);

	const handleLongPress = useCallback(
		(entry: EntryWithJournal) => {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
			setSelectedEntry(entry);
			actionSheet.open();
		},
		[actionSheet],
	);

	const handleDelete = useCallback(async () => {
		if (!selectedEntry) return;

		const confirmed = await dialog.confirm({
			title: 'Delete Entry',
			description: 'This entry will be permanently deleted. This cannot be undone.',
			confirmLabel: 'Delete',
			variant: 'danger',
		});

		if (!confirmed) return;

		await deleteEntry(selectedEntry.id);
	}, [selectedEntry, deleteEntry, dialog]);

	const actionItems: readonly ActionSheetItem[] = useMemo(
		() => [
			{
				id: 'delete',
				label: 'Delete',
				icon: Trash2,
				variant: 'danger' as const,
				onPress: handleDelete,
			},
		],
		[handleDelete],
	);

	return (
		<ScreenLayout title="History">
			<SearchInput
				value={searchQuery}
				onChangeText={handleSearch}
				placeholder="Search entries..."
			/>

			<FlatList
				className="rounded-t-4xl overflow-hidden"
				data={entries}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => (
					<EntryCard
						entry={item}
						showJournalName
						onPress={() => router.push(`/journal/${item.journalId}/entry/${item.id}`)}
						onLongPress={() => handleLongPress(item)}
					/>
				)}
				contentContainerClassName="pt-2 px-4 gap-3"
				contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
				ListEmptyComponent={
					searchQuery.length > 0 ? (
						<EmptyState
							icon={<Search size={48} color={muted} />}
							title="No results"
							description="Try a different search term."
						/>
					) : (
						<EmptyState
							icon={<Clock size={48} color={muted} />}
							title="No entries yet"
							description="Your journal entries will appear here."
						/>
					)
				}
			/>

			<ActionSheet
				header={
					selectedEntry ? (
						<EntryCard entry={selectedEntry} showJournalName onPress={() => {}} />
					) : null
				}
				items={actionItems}
				sheet={actionSheet}
			/>

			<AppDialog
				{...dialog.state}
				onConfirm={dialog.handleConfirm}
				onCancel={dialog.handleCancel}
			/>
		</ScreenLayout>
	);
}
