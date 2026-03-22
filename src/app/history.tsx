import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EntryCard } from '@/components/entry-card';
import { ScreenLayout } from '@/components/screen-layout';
import { SearchInput } from '@/components/search-input';
import { useEntries } from '@/hooks/use-entries';

export default function HistoryScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const { entries, searchEntries } = useEntries();

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      await searchEntries(query);
    },
    [searchEntries],
  );

  return (
    <ScreenLayout title="History">
      <SearchInput value={searchQuery} onChangeText={handleSearch} placeholder="Search entries..." />

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EntryCard
            entry={item}
            showJournalName
            onPress={() => router.push(`/entry/${item.id}`)}
          />
        )}
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: insets.bottom + 16,
          paddingHorizontal: 16,
          gap: 12,
        }}
      />
    </ScreenLayout>
  );
}
