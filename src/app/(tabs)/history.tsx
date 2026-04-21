import { router } from 'expo-router';
import { Clock, Search } from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';

import { EntryCard } from '@/components/entry/entry-card';
import { MoveToJournalSheet } from '@/components/entry/move-to-journal-sheet';
import { Screen } from '@/components/layout/screen';
import { ActionSheet } from '@/components/ui/action-sheet';
import { SearchableList } from '@/components/ui/searchable-list';
import { SortMenu } from '@/components/ui/sort-menu';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { useDeleteEntry } from '@/hooks/use-delete-entry';
import { useEntries } from '@/hooks/use-entries';
import { useEntryActions } from '@/hooks/use-entry-actions';
import { useJournals } from '@/hooks/use-journals';
import { useLongPressAction } from '@/hooks/use-long-press-action';
import { useSort } from '@/hooks/use-sort';
import type { EntrySummaryWithJournal } from '@/types/entry';

export default function HistoryScreen(): React.JSX.Element {
	const { entries, searchEntries, deleteEntry } = useEntries();
	const { journals } = useJournals();
	const {
		selectedItem: selectedEntry,
		handleLongPress,
		actionSheet,
	} = useLongPressAction<EntrySummaryWithJournal>();
	const { confirmDeleteEntry } = useDeleteEntry(deleteEntry);

	const debouncedSearch = useDebouncedCallback(searchEntries);

	const handleView = useCallback(() => {
		if (!selectedEntry) return;
		router.push(`/journal/${selectedEntry.journalId}/entry/${selectedEntry.id}`);
	}, [selectedEntry]);

	const handleDelete = useCallback(async () => {
		if (!selectedEntry) return;
		await confirmDeleteEntry(selectedEntry.id);
	}, [selectedEntry, confirmDeleteEntry]);

	const { actionItems, moveSheet, moveEntry } = useEntryActions({
		entryId: selectedEntry?.id,
		onView: handleView,
		onDelete: handleDelete,
	});

	const sortOptions = useMemo(
		() => [
			{
				key: 'createdAt',
				label: 'Created',
				compare: (a: EntrySummaryWithJournal, b: EntrySummaryWithJournal) =>
					a.createdAt - b.createdAt,
			},
			{
				key: 'updatedAt',
				label: 'Updated',
				compare: (a: EntrySummaryWithJournal, b: EntrySummaryWithJournal) =>
					a.updatedAt - b.updatedAt,
			},
		],
		[],
	);
	const sort = useSort({ options: sortOptions, defaultKey: 'createdAt' });
	const sortedEntries = useMemo(() => sort.sort(entries) ?? [], [sort, entries]);

	return (
		<Screen title="History" showBackButton={false}>
			<SearchableList
				data={sortedEntries}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => (
					<EntryCard
						entry={item}
						showJournalName
						onPress={() => router.push(`/journal/${item.journalId}/entry/${item.id}`)}
						onLongPress={() => handleLongPress(item)}
					/>
				)}
				onQueryChange={debouncedSearch}
				searchPlaceholder="Search entries..."
				emptyState={{
					icon: Clock,
					title: 'No entries yet',
					description: 'Your journal entries will appear here.',
				}}
				noResultsState={{
					icon: Search,
					title: 'No results',
					description: 'Try a different search term.',
				}}
				headerAction={<SortMenu sort={sort} />}
			/>

			<ActionSheet
				header={
					selectedEntry ? (
						<EntryCard
							entry={selectedEntry}
							showJournalName
							onPress={() => {}}
							variant="transparent"
						/>
					) : null
				}
				items={actionItems}
				sheet={actionSheet}
			/>

			<MoveToJournalSheet
				sheet={moveSheet}
				journals={journals}
				currentJournalId={selectedEntry?.journalId ?? ''}
				onMove={moveEntry}
			/>
		</Screen>
	);
}
