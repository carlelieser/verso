import { ChevronLeftIcon, Search } from 'lucide-react-native';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';

import { Button, Card } from 'heroui-native';

import { useEntries } from '@/hooks/use-entries';
import type { EntryWithJournal } from '@/services/entry-service';
import { formatRelativeDate } from '@/utils/date';

function EntryCard({
  entry,
  onPress,
}: {
  readonly entry: EntryWithJournal;
  readonly onPress: () => void;
}): React.JSX.Element {
  const preview = entry.contentText.slice(0, 120).trim();

  return (
    <Pressable onPress={onPress}>
      <Card>
        <Card.Body>
          <View>
            <View className="flex-row items-center justify-between">
              <Card.Title className="text-xs font-medium text-accent">
                {entry.journalName}
              </Card.Title>
            </View>
            <Card.Description className="font-editor text-sm mt-1" numberOfLines={2}>
              {preview || 'Empty entry'}
            </Card.Description>
            <View className="flex-row items-center justify-end">
              <Card.Description className="text-xs opacity-50">
                {formatRelativeDate(entry.createdAt)}
              </Card.Description>
            </View>
          </View>
        </Card.Body>
      </Card>
    </Pressable>
  );
}

export default function HistoryScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [muted, surface, foreground, border] = useCSSVariable([
    '--color-muted',
    '--color-surface',
    '--color-foreground',
    '--color-border',
  ]);
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
          <ChevronLeftIcon size={20} color={muted as string} />
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
          backgroundColor: surface as string,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: border as string,
          gap: 8,
        }}
      >
        <Search size={16} color={muted as string} />
        <TextInput
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search entries..."
          placeholderTextColor={muted as string}
          style={{ flex: 1, fontSize: 15, color: foreground as string, padding: 0 }}
        />
      </View>

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
      />
    </View>
  );
}
