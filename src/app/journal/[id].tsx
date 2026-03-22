import { Plus } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EntryCard } from '@/components/entry-card';
import { Fab } from '@/components/fab';
import { ScreenLayout } from '@/components/screen-layout';
import { SearchInput } from '@/components/search-input';
import { getJournalIcon } from '@/constants/journal-icons';
import { useEntries } from '@/hooks/use-entries';
import { useJournals } from '@/hooks/use-journals';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function JournalDetailScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { muted, accentForeground } = useThemeColors();
  const { journals } = useJournals();
  const journal = journals.find((j) => j.id === id);
  const { entries, searchEntries, createEntry } = useEntries(id);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      await searchEntries(query);
    },
    [searchEntries],
  );

  const handleNewEntry = useCallback(async () => {
    if (!id) return;
    const entry = await createEntry(id, '', '');
    router.push(`/entry/${entry.id}/edit`);
  }, [id, createEntry]);

  const Icon = journal ? getJournalIcon(journal.icon) : null;

  const titleContent = (
    <View className="flex-row items-center gap-3">
      {Icon ? <Icon size={28} color={muted} /> : null}
      <Text className="text-5xl font-heading text-foreground">
        {journal?.name ?? 'Journal'}
      </Text>
    </View>
  );

  return (
    <ScreenLayout title={titleContent}>
      <SearchInput value={searchQuery} onChangeText={handleSearch} placeholder="Search entries..." />

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EntryCard
            entry={item}
            onPress={() => router.push(`/entry/${item.id}`)}
          />
        )}
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: insets.bottom + 16,
          paddingHorizontal: 16,
          gap: 12,
        }}
        ListEmptyComponent={
          <View className="items-center pt-12">
            <Text className="text-muted">No entries yet</Text>
          </View>
        }
      />

      <Fab icon={<Plus size={24} color={accentForeground} />} onPress={handleNewEntry} />
    </ScreenLayout>
  );
}
