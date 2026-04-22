import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
	EllipsisVertical,
	Lock,
	Maximize,
	Palette,
	Pencil,
	Plus,
	ScrollText,
	Search,
	Star,
	Trash2,
} from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import { Text, View } from 'react-native';

import { EntryCard } from '@/components/entry/entry-card';
import { MoveToJournalSheet } from '@/components/entry/move-to-journal-sheet';
import { ChangeJournalColor } from '@/components/journal/change-journal-color';
import { ChangeJournalIcon } from '@/components/journal/change-journal-icon';
import { JournalColorBanner } from '@/components/journal/journal-color-banner';
import { JournalPrivacySheet } from '@/components/journal/journal-privacy-sheet';
import { RenameJournal } from '@/components/journal/rename-journal';
import { Screen } from '@/components/layout/screen';
import { JournalLockGate } from '@/components/security/journal-lock-gate';
import { ActionSheet } from '@/components/ui/action-sheet';
import { Fab } from '@/components/ui/fab';
import { FabMenu } from '@/components/ui/fab-menu';
import { SearchableList } from '@/components/ui/searchable-list';
import { SortMenu } from '@/components/ui/sort-menu';
import { DEFAULT_JOURNAL_COLOR, getJournalIcon } from '@/constants/journal-icons';
import { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { useDeleteEntry } from '@/hooks/use-delete-entry';
import { useEntries } from '@/hooks/use-entries';
import { useEntryActions } from '@/hooks/use-entry-actions';
import { useJournalActions } from '@/hooks/use-journal-actions';
import { useJournals } from '@/hooks/use-journals';
import { useLongPressAction } from '@/hooks/use-long-press-action';
import { useSort } from '@/hooks/use-sort';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { EntrySummaryWithJournal } from '@/types/entry';
import { isLightColor } from '@/utils/color';
import { formatJournalMeta } from '@/utils/format-journal-meta';

export default function JournalDetailScreen(): React.JSX.Element {
	const { journalId } = useLocalSearchParams<{ journalId: string }>();
	const { muted, danger, foreground, accentForeground } = useThemeColors();
	const { journals, entryCounts, updateJournal, setDefaultJournal, deleteJournal } =
		useJournals();
	const journal = journals.find((j) => j.id === journalId);
	const isDefault = journal?.displayOrder === 0;
	const entryCount = journalId ? entryCounts.get(journalId) ?? 0 : 0;
	const { entries, searchEntries, createEntry, deleteEntry } = useEntries(journalId);
	const privacySheet = useBottomSheet();
	const {
		selectedItem: selectedEntry,
		handleLongPress: handleEntryLongPress,
		actionSheet: entryActionSheet,
	} = useLongPressAction<EntrySummaryWithJournal>();

	const handleJournalDeleted = useCallback(() => router.back(), []);

	const {
		renameSheet,
		iconSheet,
		colorSheet,
		handleRename,
		handleChangeIcon,
		handleChangeColor,
		handleSetDefault,
		handleDelete: handleDeleteJournal,
	} = useJournalActions({
		journalId,
		journalName: journal?.name,
		updateJournal,
		setDefaultJournal,
		deleteJournal,
		onDeleted: handleJournalDeleted,
	});

	const { confirmDeleteEntry } = useDeleteEntry(deleteEntry);

	const debouncedSearch = useDebouncedCallback(searchEntries);

	const handleNewEntry = useCallback(async () => {
		if (!journalId) return;
		const entry = await createEntry(journalId);
		router.push(`/journal/${journalId}/entry/${entry.id}/edit`);
	}, [journalId, createEntry]);

	const entrySortOptions = useMemo(
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
	const sort = useSort({ options: entrySortOptions, defaultKey: 'createdAt' });
	const sortedEntries = useMemo(() => sort.sort(entries) ?? [], [sort, entries]);

	const menuItems = useMemo(
		() => [
			{
				id: 'rename',
				label: 'Rename',
				icon: <Pencil size={16} color={muted} />,
				onPress: renameSheet.open,
			},
			{
				id: 'change-icon',
				label: 'Change icon',
				icon: <Maximize size={16} color={muted} />,
				onPress: iconSheet.open,
			},
			{
				id: 'change-color',
				label: 'Change color',
				icon: <Palette size={16} color={muted} />,
				onPress: colorSheet.open,
			},
			{
				id: 'privacy',
				label: 'Privacy',
				icon: <Lock size={16} color={muted} />,
				onPress: privacySheet.open,
			},
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
							onPress: handleDeleteJournal,
						},
				  ]
				: []),
		],
		[
			muted,
			danger,
			isDefault,
			renameSheet,
			iconSheet,
			colorSheet,
			privacySheet,
			handleSetDefault,
			handleDeleteJournal,
		],
	);

	const handleDeleteEntry = useCallback(async () => {
		if (!selectedEntry) return;
		await confirmDeleteEntry(selectedEntry.id);
	}, [selectedEntry, confirmDeleteEntry]);

	const handleViewEntry = useCallback(() => {
		if (!selectedEntry || !journalId) return;
		router.push(`/journal/${journalId}/entry/${selectedEntry.id}`);
	}, [selectedEntry, journalId]);

	const {
		actionItems: entryActionItems,
		moveSheet,
		moveEntry: moveEntryTo,
	} = useEntryActions({
		entryId: selectedEntry?.id,
		onView: handleViewEntry,
		onDelete: handleDeleteEntry,
	});

	const Icon = journal ? getJournalIcon(journal.icon) : null;

	const subtitle = formatJournalMeta(entryCount, isDefault ?? false, journal?.isLocked ?? false);

	const titleContent = (
		<View className="flex-row items-center gap-4">
			{Icon ? <Icon size={28} color={journal?.color ?? muted} /> : null}
			<View>
				<Text className="text-5xl font-heading text-foreground pb-2">
					{journal?.name ?? 'Journal'}
				</Text>
				<Text className="text-xs text-muted font-medium">{subtitle}</Text>
			</View>
		</View>
	);

	const banner = journal ? (
		<JournalColorBanner color={journal.color} seed={journal.id} height={75} />
	) : null;

	const statusBarStyle = journal ? (isLightColor(journal.color) ? 'dark' : 'light') : 'auto';

	return (
		<JournalLockGate journalId={journalId ?? ''}>
			<StatusBar style={statusBarStyle} />
			<Screen
				title={titleContent}
				headerAbove={banner}
				disableTopInset={true}
				fab={
					<View className="gap-3">
						<FabMenu
							icon={<EllipsisVertical size={24} color={foreground} />}
							items={menuItems}
						/>
						<Fab
							icon={<Plus size={24} color={accentForeground} />}
							onPress={handleNewEntry}
						/>
					</View>
				}
			>
				<SearchableList
					data={sortedEntries}
					keyExtractor={(item) => item.id}
					renderItem={({ item }) => (
						<EntryCard
							entry={item}
							onPress={() => router.push(`/journal/${journalId}/entry/${item.id}`)}
							onLongPress={() => handleEntryLongPress(item)}
						/>
					)}
					onQueryChange={debouncedSearch}
					searchPlaceholder="Search entries..."
					emptyState={{
						icon: ScrollText,
						title: 'No entries yet',
						description: 'Tap + to write your first entry.',
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
								onPress={() => {}}
								variant="transparent"
							/>
						) : null
					}
					items={entryActionItems}
					sheet={entryActionSheet}
				/>

				<MoveToJournalSheet
					sheet={moveSheet}
					journals={journals}
					currentJournalId={selectedEntry?.journalId ?? journalId ?? ''}
					onMove={moveEntryTo}
				/>

				{renameSheet.isOpen ? (
					<RenameJournal
						sheet={renameSheet}
						currentName={journal?.name ?? ''}
						onRename={handleRename}
					/>
				) : null}

				{iconSheet.isOpen ? (
					<ChangeJournalIcon
						sheet={iconSheet}
						currentIcon={journal?.icon ?? 'book-open'}
						onChangeIcon={handleChangeIcon}
					/>
				) : null}

				{colorSheet.isOpen ? (
					<ChangeJournalColor
						sheet={colorSheet}
						currentColor={journal?.color ?? DEFAULT_JOURNAL_COLOR}
						onChangeColor={handleChangeColor}
					/>
				) : null}

				{privacySheet.isOpen && journalId ? (
					<JournalPrivacySheet sheet={privacySheet} journalId={journalId} />
				) : null}
			</Screen>
		</JournalLockGate>
	);
}
