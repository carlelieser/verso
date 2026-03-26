import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ArrowUpRight, BookOpen, Palette, Pencil, Plus, Search, Star, Trash2 } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionSheet, type ActionSheetItem } from '@/components/action-sheet';
import { AppDialog } from '@/components/app-dialog';
import { ChangeJournalIcon } from '@/components/change-journal-icon';
import { CreateJournal } from '@/components/create-journal';
import { EmptyState } from '@/components/empty-state';
import { Fab } from '@/components/fab';
import { JournalCard } from '@/components/journal-card';
import { RenameJournal } from '@/components/rename-journal';
import { ScreenLayout } from '@/components/screen-layout';
import { SearchInput } from '@/components/search-input';
import { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { useDialog } from '@/hooks/use-dialog';
import { useJournals } from '@/hooks/use-journals';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { Journal } from '@/types/journal';

export default function JournalsScreen(): React.JSX.Element {
	const insets = useSafeAreaInsets();
	const { muted, accentForeground } = useThemeColors();
	const [searchQuery, setSearchQuery] = useState('');
	const { journals, entryCounts, createJournal, updateJournal, setDefaultJournal, deleteJournal } =
		useJournals();
	const createSheet = useBottomSheet();
	const renameSheet = useBottomSheet();
	const iconSheet = useBottomSheet();
	const actionSheet = useBottomSheet();
	const dialog = useDialog();
	const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);

	const filteredJournals = useMemo(() => {
		if (searchQuery.trim().length === 0) return journals;
		const query = searchQuery.toLowerCase();
		return journals.filter((j) => j.name.toLowerCase().includes(query));
	}, [journals, searchQuery]);

	const handleCreate = useCallback(
		async (name: string, icon: string) => {
			await createJournal(name, icon);
			createSheet.close();
		},
		[createJournal, createSheet],
	);

	const handleLongPress = useCallback(
		(journal: Journal) => {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
			setSelectedJournal(journal);
			actionSheet.open();
		},
		[actionSheet],
	);

	const handleRename = useCallback(
		async (name: string) => {
			if (!selectedJournal) return;
			await updateJournal(selectedJournal.id, { name });
			renameSheet.close();
		},
		[selectedJournal, updateJournal, renameSheet],
	);

	const handleChangeIcon = useCallback(
		async (icon: string) => {
			if (!selectedJournal) return;
			await updateJournal(selectedJournal.id, { icon });
			iconSheet.close();
		},
		[selectedJournal, updateJournal, iconSheet],
	);

	const handleSetDefault = useCallback(async () => {
		if (!selectedJournal) return;
		await setDefaultJournal(selectedJournal.id);
	}, [selectedJournal, setDefaultJournal]);

	const handleDelete = useCallback(async () => {
		if (!selectedJournal) return;

		const confirmed = await dialog.confirm({
			title: 'Delete Journal',
			description: `All entries in "${selectedJournal.name}" will be permanently deleted. This cannot be undone.`,
			confirmLabel: 'Delete',
			variant: 'danger',
		});

		if (!confirmed) return;

		await deleteJournal(selectedJournal.id);
	}, [selectedJournal, deleteJournal, dialog]);

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
				icon: Palette,
				onPress: iconSheet.open,
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
		[isSelectedDefault, renameSheet, iconSheet, handleView, handleSetDefault, handleDelete],
	);

	return (
		<ScreenLayout title="Journals">
			<SearchInput
				value={searchQuery}
				onChangeText={setSearchQuery}
				placeholder="Search journals..."
			/>

			<FlatList
				className="rounded-t-4xl overflow-hidden"
				data={filteredJournals}
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
				contentContainerClassName="pt-2 px-4 gap-3"
				contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
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

			<Fab
				icon={<Plus size={24} color={accentForeground} />}
				onPress={createSheet.open}
				className="absolute right-4"
				style={{ bottom: insets.bottom + 16 }}
			/>

			{createSheet.isOpen ? (
				<BottomSheet ref={createSheet.ref} {...createSheet.sheetProps}>
					<BottomSheetScrollView keyboardShouldPersistTaps="handled">
						<CreateJournal onCreate={handleCreate} />
					</BottomSheetScrollView>
				</BottomSheet>
			) : null}

			<ActionSheet
				header={
					selectedJournal ? (
						<JournalCard
							journal={selectedJournal}
							entryCount={entryCounts.get(selectedJournal.id) ?? 0}
							isDefault={selectedJournal.displayOrder === 0}
							onPress={() => {}}
						/>
					) : null
				}
				items={actionItems}
				sheet={actionSheet}
			/>

			{renameSheet.isOpen ? (
				<BottomSheet ref={renameSheet.ref} {...renameSheet.sheetProps}>
					<BottomSheetScrollView keyboardShouldPersistTaps="handled">
						<RenameJournal
							currentName={selectedJournal?.name ?? ''}
							onRename={handleRename}
						/>
					</BottomSheetScrollView>
				</BottomSheet>
			) : null}

			{iconSheet.isOpen ? (
				<BottomSheet ref={iconSheet.ref} {...iconSheet.sheetProps}>
					<BottomSheetScrollView>
						<ChangeJournalIcon
							currentIcon={selectedJournal?.icon ?? 'book-open'}
							onChangeIcon={handleChangeIcon}
						/>
					</BottomSheetScrollView>
				</BottomSheet>
			) : null}

			<AppDialog
				{...dialog.state}
				onConfirm={dialog.handleConfirm}
				onCancel={dialog.handleCancel}
			/>
		</ScreenLayout>
	);
}
