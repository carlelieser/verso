import { ChevronLeftIcon, Search } from 'lucide-react-native';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from 'heroui-native';

import { EntryCard } from '@/components/entry-card';
import { useEntries } from '@/hooks/use-entries';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function HistoryScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { muted, surface, foreground, border } = useThemeColors();
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
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="p-3 gap-1">
        <Button variant="ghost" size="sm" isIconOnly onPress={() => router.back()}>
          <ChevronLeftIcon size={20} color={muted} />
        </Button>
        <Text className="text-5xl font-heading text-foreground ml-2 pb-2">History</Text>
      </View>

      {/* Search input */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginHorizontal: 16,
          marginBottom: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
          backgroundColor: surface,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: border,
          gap: 8,
        }}
      >
        <Search size={16} color={muted} />
        <TextInput
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search entries..."
          placeholderTextColor={muted}
          style={{ flex: 1, fontSize: 15, color: foreground, padding: 0 }}
        />
      </View>

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
    </View>
  );
}
