import { Plus } from 'lucide-react-native';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

import { CreateJournal } from '@/components/create-journal';
import { Fab } from '@/components/fab';
import { JournalCard } from '@/components/journal-card';
import { ScreenLayout } from '@/components/screen-layout';
import { SearchInput } from '@/components/search-input';
import { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { useJournals } from '@/hooks/use-journals';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function JournalsScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { accentForeground } = useThemeColors();
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
      <SearchInput value={searchQuery} onChangeText={setSearchQuery} placeholder="Search journals..." />

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
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: insets.bottom + 80,
          paddingHorizontal: 16,
          gap: 12,
        }}
      />

      <Fab icon={<Plus size={24} color={accentForeground} />} onPress={sheet.open} />

      {sheet.isOpen ? (
        <BottomSheet ref={sheet.ref} {...sheet.sheetProps}>
          <BottomSheetView>
            <CreateJournal onCreate={handleCreate} />
          </BottomSheetView>
        </BottomSheet>
      ) : null}
    </ScreenLayout>
  );
}
