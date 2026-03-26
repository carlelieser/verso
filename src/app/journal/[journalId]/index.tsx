import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { EllipsisVertical, Plus, ScrollText, Search, Star, Trash2 } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionSheet, type ActionSheetItem } from '@/components/action-sheet';
import { AppDialog } from '@/components/app-dialog';
import { EmptyState } from '@/components/empty-state';
import { EntryCard } from '@/components/entry-card';
import { Fab } from '@/components/fab';
import { FabMenu } from '@/components/fab-menu';
import { ScreenLayout } from '@/components/screen-layout';
import { SearchInput } from '@/components/search-input';
import { getJournalIcon } from '@/constants/journal-icons';
import { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { useDialog } from '@/hooks/use-dialog';
import { useEntries } from '@/hooks/use-entries';
import { useJournals } from '@/hooks/use-journals';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { EntryWithJournal } from '@/types/entry';
import { formatJournalMeta } from '@/utils/format-journal-meta';

export default function JournalDetailScreen(): React.JSX.Element {
	const { journalId } = useLocalSearchParams<{ journalId: string }>();
	const insets = useSafeAreaInsets();
	const { muted, danger, foreground, accentForeground } = useThemeColors();
	const { journals, entryCounts, setDefaultJournal, deleteJournal } = useJournals();
	const journal = journals.find((j) => j.id === journalId);
	const isDefault = journal?.displayOrder === 0;
	const entryCount = journalId ? (entryCounts.get(journalId) ?? 0) : 0;
	const { entries, searchEntries, createEntry, deleteEntry } = useEntries(journalId);
	const [searchQuery, setSearchQuery] = useState('');
	const dialog = useDialog();
	const entryActionSheet = useBottomSheet();
	const [selectedEntry, setSelectedEntry] = useState<EntryWithJournal | null>(null);

	const handleSearch = useCallback(
		async (query: string) => {
			setSearchQuery(query);
			await searchEntries(query);
		},
		[searchEntries],
	);

	const handleNewEntry = useCallback(async () => {
		if (!journalId) return;
		const entry = await createEntry(journalId);
		router.push(`/journal/${journalId}/entry/${entry.id}/edit`);
	}, [journalId, createEntry]);

	const handleSetDefault = useCallback(async () => {
		if (!journalId) return;
		await setDefaultJournal(journalId);
	}, [journalId, setDefaultJournal]);

	const handleDelete = useCallback(async () => {
		if (!journalId) return;

		const confirmed = await dialog.confirm({
			title: 'Delete Journal',
			description: `All entries in "${journal?.name ?? 'this journal'}" will be permanently deleted. This cannot be undone.`,
			confirmLabel: 'Delete',
			variant: 'danger',
		});

		if (!confirmed) return;

		await deleteJournal(journalId);
		router.back();
	}, [journalId, journal?.name, deleteJournal, dialog]);

	const menuItems = useMemo(
		() => [
			...(!isDefault
				? [
						{
							id: 'set-default',
							label: 'Set as default',
							icon: <Star size={16} color={muted} />,
							onPress: handleSetDefault,
						},
						{
							id: 'delete',
							label: 'Delete',
							icon: <Trash2 size={16} color={danger} />,
							variant: 'danger' as const,
							onPress: handleDelete,
						},
					]
				: []),
		],
		[muted, danger, isDefault, handleSetDefault, handleDelete],
	);

	const handleEntryLongPress = useCallback(
		(entry: EntryWithJournal) => {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
			setSelectedEntry(entry);
			entryActionSheet.open();
		},
		[entryActionSheet],
	);

	const handleDeleteEntry = useCallback(async () => {
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

	const entryActionItems: readonly ActionSheetItem[] = useMemo(
		() => [
			{
				id: 'delete',
				label: 'Delete',
				icon: Trash2,
				variant: 'danger' as const,
				onPress: handleDeleteEntry,
			},
		],
		[handleDeleteEntry],
	);

	const Icon = journal ? getJournalIcon(journal.icon) : null;

	const subtitle = formatJournalMeta(entryCount, isDefault ?? false);

	const titleContent = (
		<View className="flex-row items-center gap-4">
			{Icon ? <Icon size={28} color={muted} /> : null}
			<View>
				<Text className="text-5xl font-heading text-foreground pb-2">
					{journal?.name ?? 'Journal'}
				</Text>
				<Text className="text-xs text-muted">{subtitle}</Text>
			</View>
		</View>
	);

	return (
		<ScreenLayout title={titleContent}>
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
						onPress={() => router.push(`/journal/${journalId}/entry/${item.id}`)}
						onLongPress={() => handleEntryLongPress(item)}
					/>
				)}
				contentContainerClassName="pt-2 px-4 gap-3"
				contentContainerStyle={{ paddingBottom: insets.bottom + 188 }}
				ListEmptyComponent={
					searchQuery.length > 0 ? (
						<EmptyState
							icon={<Search size={48} color={muted} />}
							title="No results"
							description="Try a different search term."
						/>
					) : (
						<EmptyState
							icon={<ScrollText size={48} color={muted} />}
							title="No entries yet"
							description="Tap + to write your first entry."
						/>
					)
				}
			/>

			<Fab
				icon={<Plus size={24} color={accentForeground} />}
				onPress={handleNewEntry}
				className="absolute right-4"
				style={{ bottom: insets.bottom + 16 }}
			/>

			<FabMenu
				icon={<EllipsisVertical size={24} color={foreground} />}
				items={menuItems}
				className="absolute right-4"
				style={{ bottom: insets.bottom + 98 }}
			/>

			<ActionSheet
				header={
					selectedEntry ? <EntryCard entry={selectedEntry} onPress={() => {}} /> : null
				}
				items={entryActionItems}
				sheet={entryActionSheet}
			/>

			<AppDialog
				{...dialog.state}
				onConfirm={dialog.handleConfirm}
				onCancel={dialog.handleCancel}
			/>
		</ScreenLayout>
	);
}
