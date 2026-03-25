import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import { BookOpen, Plus, Search } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CreateJournal } from '@/components/create-journal';
import { EmptyState } from '@/components/empty-state';
import { Fab } from '@/components/fab';
import { JournalCard } from '@/components/journal-card';
import { ScreenLayout } from '@/components/screen-layout';
import { SearchInput } from '@/components/search-input';
import { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { useJournals } from '@/hooks/use-journals';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function JournalsScreen(): React.JSX.Element {
	const insets = useSafeAreaInsets();
	const { muted, accentForeground } = useThemeColors();
	const [searchQuery, setSearchQuery] = useState('');
	const { journals, entryCounts, createJournal } = useJournals();
	const sheet = useBottomSheet();

	const filteredJournals = useMemo(() => {
		if (searchQuery.trim().length === 0) return journals;
		const query = searchQuery.toLowerCase();
		return journals.filter((j) => j.name.toLowerCase().includes(query));
	}, [journals, searchQuery]);

	const handleCreate = useCallback(
		async (name: string, icon: string) => {
			await createJournal(name, icon);
			sheet.close();
		},
		[createJournal, sheet],
	);

	return (
		<ScreenLayout title="Journals">
			<SearchInput
				value={searchQuery}
				onChangeText={setSearchQuery}
				placeholder="Search journals..."
			/>

			<FlatList
				data={filteredJournals}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => (
					<JournalCard
						journal={item}
						entryCount={entryCounts.get(item.id) ?? 0}
						onPress={() => router.push(`/journal/${item.id}`)}
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
				onPress={sheet.open}
				className="absolute right-4"
				style={{ bottom: insets.bottom + 16 }}
			/>

			{sheet.isOpen ? (
				<BottomSheet ref={sheet.ref} {...sheet.sheetProps}>
					<BottomSheetScrollView keyboardShouldPersistTaps="handled">
						<CreateJournal onCreate={handleCreate} />
					</BottomSheetScrollView>
				</BottomSheet>
			) : null}
		</ScreenLayout>
	);
}
