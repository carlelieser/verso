import { router } from 'expo-router';
import {
	ArrowUpRight,
	BookOpen,
	Lock,
	Maximize,
	Palette,
	Pencil,
	Plus,
	Search,
	Star,
	Trash2,
} from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList } from 'react-native';

import { ChangeJournalColor } from '@/components/journal/change-journal-color';
import { ChangeJournalIcon } from '@/components/journal/change-journal-icon';
import { CreateJournal } from '@/components/journal/create-journal';
import { JournalCard } from '@/components/journal/journal-card';
import { JournalPrivacySheet } from '@/components/journal/journal-privacy-sheet';
import { RenameJournal } from '@/components/journal/rename-journal';
import { Screen } from '@/components/layout/screen';
import { ActionSheet, type ActionSheetItem } from '@/components/ui/action-sheet';
import { EmptyState } from '@/components/ui/empty-state';
import { Fab } from '@/components/ui/fab';
import { SearchInput } from '@/components/ui/search-input';
import { DEFAULT_JOURNAL_COLOR } from '@/constants/journal-icons';
import { useScreenInsets } from '@/contexts/screen-context';
import { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { useJournalActions } from '@/hooks/use-journal-actions';
import { useJournals } from '@/hooks/use-journals';
import { useLongPressAction } from '@/hooks/use-long-press-action';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { Journal } from '@/types/journal';

function JournalList({
	journals,
	entryCounts,
	searchQuery,
	onSearchChange,
	onLongPress,
	muted,
}: {
	readonly journals: readonly Journal[];
	readonly entryCounts: ReadonlyMap<string, number>;
	readonly searchQuery: string;
	readonly onSearchChange: (query: string) => void;
	readonly onLongPress: (journal: Journal) => void;
	readonly muted: string;
}): React.JSX.Element {
	const { contentInsetBottom } = useScreenInsets();

	return (
		<>
			<SearchInput
				value={searchQuery}
				onChangeText={onSearchChange}
				placeholder="Search journals..."
			/>

			<FlatList
				className="rounded-t-4xl overflow-hidden"
				data={journals}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => (
					<JournalCard
						journal={item}
						entryCount={entryCounts.get(item.id) ?? 0}
						isDefault={item.displayOrder === 0}
						onPress={() => router.push(`/journal/${item.id}`)}
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
							icon={<BookOpen size={48} color={muted} />}
							title="No journals yet"
							description="Tap + to create your first journal."
						/>
					)
				}
			/>
		</>
	);
}

export default function JournalsScreen(): React.JSX.Element {
	const { muted, accentForeground } = useThemeColors();
	const [searchQuery, setSearchQuery] = useState('');
	const {
		journals,
		entryCounts,
		createJournal,
		updateJournal,
		setDefaultJournal,
		deleteJournal,
	} = useJournals();
	const createSheet = useBottomSheet();
	const privacySheet = useBottomSheet();
	const {
		selectedItem: selectedJournal,
		handleLongPress,
		actionSheet,
	} = useLongPressAction<Journal>();

	const {
		renameSheet,
		iconSheet,
		colorSheet,
		handleRename,
		handleChangeIcon,
		handleChangeColor,
		handleSetDefault,
		handleDelete,
	} = useJournalActions({
		journalId: selectedJournal?.id,
		journalName: selectedJournal?.name,
		updateJournal,
		setDefaultJournal,
		deleteJournal,
	});

	const filteredJournals = useMemo(() => {
		if (searchQuery.trim().length === 0) return journals;
		const query = searchQuery.toLowerCase();
		return journals.filter((j) => j.name.toLowerCase().includes(query));
	}, [journals, searchQuery]);

	const handleCreate = useCallback(
		async (name: string, icon: string, color: string) => {
			await createJournal(name, icon, color);
			createSheet.close();
		},
		[createJournal, createSheet],
	);

	const isSelectedDefault = selectedJournal?.displayOrder === 0;

	const handleView = useCallback(() => {
		if (!selectedJournal) return;
		router.push(`/journal/${selectedJournal.id}`);
	}, [selectedJournal]);

	const actionItems: readonly ActionSheetItem[] = useMemo(
		() => [
			{
				id: 'view',
				label: 'View',
				icon: ArrowUpRight,
				onPress: handleView,
			},
			{
				id: 'rename',
				label: 'Rename',
				icon: Pencil,
				onPress: renameSheet.open,
			},
			{
				id: 'change-icon',
				label: 'Change icon',
				icon: Maximize,
				onPress: iconSheet.open,
			},
			{
				id: 'change-color',
				label: 'Change color',
				icon: Palette,
				onPress: colorSheet.open,
			},
			{
				id: 'privacy',
				label: 'Privacy',
				icon: Lock,
				onPress: privacySheet.open,
			},
			...(!isSelectedDefault
				? [
						{
							id: 'set-default',
							label: 'Set as default',
							icon: Star,
							onPress: handleSetDefault,
						},
						{
							id: 'delete',
							label: 'Delete',
							icon: Trash2,
							variant: 'danger' as const,
							onPress: handleDelete,
						},
				  ]
				: []),
		],
		[
			isSelectedDefault,
			renameSheet,
			iconSheet,
			colorSheet,
			privacySheet,
			handleView,
			handleSetDefault,
			handleDelete,
		],
	);

	return (
		<Screen
			title="Journals"
			fab={
				<Fab
					icon={<Plus size={24} color={accentForeground} />}
					onPress={createSheet.open}
				/>
			}
		>
			<JournalList
				journals={filteredJournals}
				entryCounts={entryCounts}
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				onLongPress={handleLongPress}
				muted={muted}
			/>

			{createSheet.isOpen ? (
				<CreateJournal sheet={createSheet} onCreate={handleCreate} />
			) : null}

			<ActionSheet
				header={
					selectedJournal ? (
						<JournalCard
							className={'rounded-none'}
							journal={selectedJournal}
							entryCount={entryCounts.get(selectedJournal.id) ?? 0}
							isDefault={selectedJournal.displayOrder === 0}
							onPress={() => {}}
							variant="transparent"
						/>
					) : null
				}
				items={actionItems}
				sheet={actionSheet}
			/>

			{renameSheet.isOpen ? (
				<RenameJournal
					sheet={renameSheet}
					currentName={selectedJournal?.name ?? ''}
					onRename={handleRename}
				/>
			) : null}

			{iconSheet.isOpen ? (
				<ChangeJournalIcon
					sheet={iconSheet}
					currentIcon={selectedJournal?.icon ?? 'book-open'}
					onChangeIcon={handleChangeIcon}
				/>
			) : null}

			{colorSheet.isOpen ? (
				<ChangeJournalColor
					sheet={colorSheet}
					currentColor={selectedJournal?.color ?? DEFAULT_JOURNAL_COLOR}
					onChangeColor={handleChangeColor}
				/>
			) : null}

			{privacySheet.isOpen && selectedJournal ? (
				<JournalPrivacySheet
					key={selectedJournal.id}
					sheet={privacySheet}
					journalId={selectedJournal.id}
				/>
			) : null}
		</Screen>
	);
}
