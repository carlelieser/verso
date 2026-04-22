import { router } from 'expo-router';
import { Clock, Search } from 'lucide-react-native';
import React, { memo, useCallback, useMemo } from 'react';
import type { ListRenderItem } from 'react-native';

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

	const renderItem = useCallback<ListRenderItem<EntrySummaryWithJournal>>(
		({ item }) => <EntryRow entry={item} onLongPress={handleLongPress} />,
		[handleLongPress],
	);

	return (
		<Screen title="History" showBackButton={false}>
			<SearchableList
				data={sortedEntries}
				keyExtractor={entryKeyExtractor}
				renderItem={renderItem}
				onQueryChange={debouncedSearch}
				searchPlaceholder="Search entries..."
				emptyState={EMPTY_STATE}
				noResultsState={NO_RESULTS_STATE}
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

const entryKeyExtractor = (item: EntrySummaryWithJournal): string => item.id;

const EMPTY_STATE = {
	icon: Clock,
	title: 'No entries yet',
	description: 'Your journal entries will appear here.',
} as const;

const NO_RESULTS_STATE = {
	icon: Search,
	title: 'No results',
	description: 'Try a different search term.',
} as const;

interface EntryRowProps {
	readonly entry: EntrySummaryWithJournal;
	readonly onLongPress: (item: EntrySummaryWithJournal) => void;
}

const EntryRow = memo(function EntryRow({ entry, onLongPress }: EntryRowProps): React.JSX.Element {
	const handlePress = useCallback(() => {
		router.push(`/journal/${entry.journalId}/entry/${entry.id}`);
	}, [entry.journalId, entry.id]);

	const handleLongPress = useCallback(() => {
		onLongPress(entry);
	}, [onLongPress, entry]);

	return (
		<EntryCard
			entry={entry}
			showJournalName
			onPress={handlePress}
			onLongPress={handleLongPress}
		/>
	);
});
