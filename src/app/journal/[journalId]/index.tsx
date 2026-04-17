import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
	ArrowUpRight,
	EllipsisVertical,
	Maximize,
	Palette,
	Pencil,
	Plus,
	ScrollText,
	Search,
	Star,
	Trash2,
} from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { EntryCard } from '@/components/entry/entry-card';
import { ChangeJournalColor } from '@/components/journal/change-journal-color';
import { ChangeJournalIcon } from '@/components/journal/change-journal-icon';
import { JournalColorBanner } from '@/components/journal/journal-color-banner';
import { RenameJournal } from '@/components/journal/rename-journal';
import { Screen } from '@/components/layout/screen';
import { ActionSheet, type ActionSheetItem } from '@/components/ui/action-sheet';
import { EmptyState } from '@/components/ui/empty-state';
import { Fab } from '@/components/ui/fab';
import { FabMenu } from '@/components/ui/fab-menu';
import { SearchInput } from '@/components/ui/search-input';
import { DEFAULT_JOURNAL_COLOR, getJournalIcon } from '@/constants/journal-icons';
import { useScreenInsets } from '@/contexts/screen-context';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { useDeleteEntry } from '@/hooks/use-delete-entry';
import { useEntries } from '@/hooks/use-entries';
import { useJournalActions } from '@/hooks/use-journal-actions';
import { useJournals } from '@/hooks/use-journals';
import { useLongPressAction } from '@/hooks/use-long-press-action';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { EntrySummaryWithJournal } from '@/types/entry';
import { isLightColor } from '@/utils/color';
import { formatJournalMeta } from '@/utils/format-journal-meta';

function EntryList({
	entries,
	journalId,
	searchQuery,
	onSearchChange,
	onLongPress,
	muted,
}: {
	readonly entries: readonly EntrySummaryWithJournal[];
	readonly journalId: string;
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
						onPress={() => router.push(`/journal/${journalId}/entry/${item.id}`)}
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
							icon={<ScrollText size={48} color={muted} />}
							title="No entries yet"
							description="Tap + to write your first entry."
						/>
					)
				}
			/>
		</>
	);
}

export default function JournalDetailScreen(): React.JSX.Element {
	const { journalId } = useLocalSearchParams<{ journalId: string }>();
	const { muted, danger, foreground, accentForeground } = useThemeColors();
	const { journals, entryCounts, updateJournal, setDefaultJournal, deleteJournal } =
		useJournals();
	const journal = journals.find((j) => j.id === journalId);
	const isDefault = journal?.displayOrder === 0;
	const entryCount = journalId ? entryCounts.get(journalId) ?? 0 : 0;
	const { entries, searchEntries, createEntry, deleteEntry } = useEntries(journalId);
	const [searchQuery, setSearchQuery] = useState('');
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

	const handleSearch = useCallback(
		(query: string) => {
			setSearchQuery(query);
			debouncedSearch(query);
		},
		[debouncedSearch],
	);

	const handleNewEntry = useCallback(async () => {
		if (!journalId) return;
		const entry = await createEntry(journalId);
		router.push(`/journal/${journalId}/entry/${entry.id}/edit`);
	}, [journalId, createEntry]);

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

	const entryActionItems: readonly ActionSheetItem[] = useMemo(
		() => [
			{
				id: 'view',
				label: 'View',
				icon: ArrowUpRight,
				onPress: handleViewEntry,
			},
			{
				id: 'delete',
				label: 'Delete',
				icon: Trash2,
				variant: 'danger' as const,
				onPress: handleDeleteEntry,
			},
		],
		[handleViewEntry, handleDeleteEntry],
	);

	const Icon = journal ? getJournalIcon(journal.icon) : null;

	const subtitle = formatJournalMeta(entryCount, isDefault ?? false);

	const titleContent = (
		<View className="flex-row items-center gap-4">
			{Icon ? <Icon size={28} color={journal?.color ?? muted} /> : null}
			<View>
				<Text className="text-5xl font-heading text-foreground pb-2">
					{journal?.name ?? 'Journal'}
				</Text>
				<Text className="text-xs text-muted">{subtitle}</Text>
			</View>
		</View>
	);

	const banner = journal ? (
		<JournalColorBanner color={journal.color} seed={journal.id} height={75} />
	) : null;

	const statusBarStyle = journal ? (isLightColor(journal.color) ? 'dark' : 'light') : 'auto';

	return (
		<>
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
				<EntryList
					entries={entries}
					journalId={journalId ?? ''}
					searchQuery={searchQuery}
					onSearchChange={handleSearch}
					onLongPress={handleEntryLongPress}
					muted={muted}
				/>

				<ActionSheet
					header={
						selectedEntry ? (
							<EntryCard entry={selectedEntry} onPress={() => {}} />
						) : null
					}
					items={entryActionItems}
					sheet={entryActionSheet}
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
			</Screen>
		</>
	);
}
