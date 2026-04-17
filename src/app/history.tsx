import { router } from 'expo-router';
import { ArrowUpRight, Clock, FolderInput, Search, Trash2 } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList } from 'react-native';

import { EntryCard } from '@/components/entry/entry-card';
import { MoveToJournalSheet } from '@/components/entry/move-to-journal-sheet';
import { Screen } from '@/components/layout/screen';
import { ActionSheet, type ActionSheetItem } from '@/components/ui/action-sheet';
import { EmptyState } from '@/components/ui/empty-state';
import { SearchInput } from '@/components/ui/search-input';
import { useScreenInsets } from '@/contexts/screen-context';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { useDeleteEntry } from '@/hooks/use-delete-entry';
import { useEntries } from '@/hooks/use-entries';
import { useJournals } from '@/hooks/use-journals';
import { useLongPressAction } from '@/hooks/use-long-press-action';
import { useMoveEntry } from '@/hooks/use-move-entry';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { EntrySummaryWithJournal } from '@/types/entry';

function HistoryList({
	entries,
	searchQuery,
	onSearchChange,
	onLongPress,
	muted,
}: {
	readonly entries: readonly EntrySummaryWithJournal[];
	readonly searchQuery: string;
	readonly onSearchChange: (query: string) => void;
	readonly onLongPress: (entry: EntrySummaryWithJournal) => void;
	readonly muted: string;
}): React.JSX.Element {
	const { contentInsetBottom } = useScreenInsets();

	return (
		<>
			<SearchInput
				value={searchQuery}
				onChangeText={onSearchChange}
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
						onLongPress={() => onLongPress(item)}
					/>
				)}
				contentContainerClassName="pt-2 px-4 gap-3"
				contentContainerStyle={{ flexGrow: 1, paddingBottom: contentInsetBottom }}
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
		</>
	);
}

export default function HistoryScreen(): React.JSX.Element {
	const { muted } = useThemeColors();
	const [searchQuery, setSearchQuery] = useState('');
	const { entries, searchEntries, deleteEntry } = useEntries();
	const { journals } = useJournals();
	const {
		selectedItem: selectedEntry,
		handleLongPress,
		actionSheet,
	} = useLongPressAction<EntrySummaryWithJournal>();
	const { confirmDeleteEntry } = useDeleteEntry(deleteEntry);
	const { moveSheet, moveEntry } = useMoveEntry();

	const debouncedSearch = useDebouncedCallback(searchEntries);

	const handleSearch = useCallback(
		(query: string) => {
			setSearchQuery(query);
			debouncedSearch(query);
		},
		[debouncedSearch],
	);

	const handleDelete = useCallback(async () => {
		if (!selectedEntry) return;
		await confirmDeleteEntry(selectedEntry.id);
	}, [selectedEntry, confirmDeleteEntry]);

	const handleView = useCallback(() => {
		if (!selectedEntry) return;
		router.push(`/journal/${selectedEntry.journalId}/entry/${selectedEntry.id}`);
	}, [selectedEntry]);

	const handleMove = useCallback(
		async (journalId: string) => {
			if (!selectedEntry) return;
			await moveEntry(selectedEntry.id, journalId);
		},
		[selectedEntry, moveEntry],
	);

	const actionItems: readonly ActionSheetItem[] = useMemo(
		() => [
			{
				id: 'view',
				label: 'View',
				icon: ArrowUpRight,
				onPress: handleView,
			},
			{
				id: 'move',
				label: 'Move',
				icon: FolderInput,
				onPress: moveSheet.open,
			},
			{
				id: 'delete',
				label: 'Delete',
				icon: Trash2,
				variant: 'danger' as const,
				onPress: handleDelete,
			},
		],
		[handleView, handleDelete, moveSheet.open],
	);

	return (
		<Screen title="History">
			<HistoryList
				entries={entries}
				searchQuery={searchQuery}
				onSearchChange={handleSearch}
				onLongPress={handleLongPress}
				muted={muted}
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

			<MoveToJournalSheet
				sheet={moveSheet}
				journals={journals}
				currentJournalId={selectedEntry?.journalId ?? ''}
				onMove={handleMove}
			/>
		</Screen>
	);
}
