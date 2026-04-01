import { router } from 'expo-router';
import { ArrowUpRight, Clock, Search, Trash2 } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EntryCard } from '@/components/entry/entry-card';
import { Screen } from '@/components/layout/screen';
import { ActionSheet, type ActionSheetItem } from '@/components/ui/action-sheet';
import { EmptyState } from '@/components/ui/empty-state';
import { SearchInput } from '@/components/ui/search-input';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { useDeleteEntry } from '@/hooks/use-delete-entry';
import { useEntries } from '@/hooks/use-entries';
import { useLongPressAction } from '@/hooks/use-long-press-action';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { EntrySummaryWithJournal } from '@/types/entry';

export default function HistoryScreen(): React.JSX.Element {
	const insets = useSafeAreaInsets();
	const { muted } = useThemeColors();
	const [searchQuery, setSearchQuery] = useState('');
	const { entries, searchEntries, deleteEntry } = useEntries();
	const { selectedItem: selectedEntry, handleLongPress, actionSheet } = useLongPressAction<EntrySummaryWithJournal>();
	const { confirmDeleteEntry } = useDeleteEntry(deleteEntry);

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

	const actionItems: readonly ActionSheetItem[] = useMemo(
		() => [
			{
				id: 'view',
				label: 'View',
				icon: ArrowUpRight,
				onPress: handleView,
			},
			{
				id: 'delete',
				label: 'Delete',
				icon: Trash2,
				variant: 'danger' as const,
				onPress: handleDelete,
			},
		],
		[handleView, handleDelete],
	);

	return (
		<Screen title="History">
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
				contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 16 }}
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

		</Screen>
	);
}
