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
import React, { useCallback, useMemo } from 'react';

import { ChangeJournalColor } from '@/components/journal/change-journal-color';
import { ChangeJournalIcon } from '@/components/journal/change-journal-icon';
import { CreateJournal } from '@/components/journal/create-journal';
import { JournalCard } from '@/components/journal/journal-card';
import { JournalPrivacySheet } from '@/components/journal/journal-privacy-sheet';
import { RenameJournal } from '@/components/journal/rename-journal';
import { Screen } from '@/components/layout/screen';
import { ActionSheet, type ActionSheetItem } from '@/components/ui/action-sheet';
import { Fab } from '@/components/ui/fab';
import { SearchableList } from '@/components/ui/searchable-list';
import { SortMenu } from '@/components/ui/sort-menu';
import { DEFAULT_JOURNAL_COLOR } from '@/constants/journal-icons';
import { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { useJournalActions } from '@/hooks/use-journal-actions';
import { useJournals } from '@/hooks/use-journals';
import { useLongPressAction } from '@/hooks/use-long-press-action';
import { useSort } from '@/hooks/use-sort';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { Journal } from '@/types/journal';

export default function JournalsScreen(): React.JSX.Element {
	const { accentForeground } = useThemeColors();
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

	const sortOptions = useMemo(
		() => [
			{
				key: 'createdAt',
				label: 'Created',
				compare: (a: Journal, b: Journal) => a.createdAt - b.createdAt,
			},
			{
				key: 'name',
				label: 'Name',
				compare: (a: Journal, b: Journal) => a.name.localeCompare(b.name),
			},
			{
				key: 'entryCount',
				label: 'Entries',
				compare: (a: Journal, b: Journal) =>
					(entryCounts.get(a.id) ?? 0) - (entryCounts.get(b.id) ?? 0),
			},
		],
		[entryCounts],
	);
	const sort = useSort({ options: sortOptions, defaultKey: 'createdAt' });
	const sortedJournals = useMemo(() => sort.sort(journals) ?? [], [sort, journals]);

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
			<SearchableList
				data={sortedJournals}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => (
					<JournalCard
						journal={item}
						entryCount={entryCounts.get(item.id) ?? 0}
						isDefault={item.displayOrder === 0}
						onPress={() => router.push(`/journal/${item.id}`)}
						onLongPress={() => handleLongPress(item)}
					/>
				)}
				filter={(item, q) => item.name.toLowerCase().includes(q.toLowerCase())}
				searchPlaceholder="Search journals..."
				emptyState={{
					icon: BookOpen,
					title: 'No journals yet',
					description: 'Tap + to create your first journal.',
				}}
				noResultsState={{
					icon: Search,
					title: 'No results',
					description: 'Try a different search term.',
				}}
				headerAction={<SortMenu sort={sort} />}
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
