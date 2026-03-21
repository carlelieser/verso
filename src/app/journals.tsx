import { ArrowLeft, Plus, Search } from 'lucide-react-native';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';

import { Button, Card } from 'heroui-native';

import { CreateJournal } from '@/components/create-journal';
import { getJournalIcon } from '@/constants/journal-icons';
import { useJournals } from '@/hooks/use-journals';
import type { Journal } from '@/types/journal';

function JournalCard({
  journal,
  entryCount,
}: {
  readonly journal: Journal;
  readonly entryCount: number;
}): React.JSX.Element {
  const [muted] = useCSSVariable(['--color-muted']);
  const Icon = getJournalIcon(journal.icon);

  return (
    <Card>
      <Card.Body>
        <View className="flex-row items-center gap-3">
          <Icon size={20} color={muted as string} />
          <View className="flex-1">
            <Card.Title>{journal.name}</Card.Title>
            <Card.Description>
              {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
            </Card.Description>
          </View>
        </View>
      </Card.Body>
    </Card>
  );
}

export default function JournalsScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [muted, accentForeground, surface, foreground, border] = useCSSVariable([
    '--color-muted',
    '--color-accent-foreground',
    '--color-surface',
    '--color-foreground',
    '--color-border',
  ]);
  const sheetRef = useRef<BottomSheet>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { journals, entryCounts, createJournal } = useJournals();

  const filteredJournals = useMemo(() => {
    if (searchQuery.trim().length === 0) return journals;
    const query = searchQuery.toLowerCase();
    return journals.filter((j) => j.name.toLowerCase().includes(query));
  }, [journals, searchQuery]);

  const openSheet = useCallback(() => sheetRef.current?.expand(), []);
  const closeSheet = useCallback(() => sheetRef.current?.close(), []);

  const handleCreate = useCallback(
    async (name: string, icon: string) => {
      await createJournal(name, icon);
      closeSheet();
    },
    [createJournal, closeSheet],
  );

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="p-3">
        <Button variant="ghost" size="sm" isIconOnly onPress={() => router.back()}>
          <ArrowLeft size={20} color={muted as string} />
        </Button>
        <Text className="text-5xl font-heading text-foreground px-3">Journals</Text>
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
          onChangeText={setSearchQuery}
          placeholder="Search journals..."
          placeholderTextColor={muted as string}
          style={{ flex: 1, fontSize: 15, color: foreground as string, padding: 0 }}
        />
      </View>

      <FlatList
        data={filteredJournals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <JournalCard journal={item} entryCount={entryCounts.get(item.id) ?? 0} />
        )}
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: insets.bottom + 80,
          paddingHorizontal: 16,
          gap: 12,
        }}
      />

      <Button
        variant="primary"
        size="lg"
        isIconOnly
        onPress={openSheet}
        className="absolute bottom-8 right-5 w-14 h-14 rounded-full shadow-2xl"
        style={{ bottom: insets.bottom + 16 }}
      >
        <Plus size={24} color={accentForeground as string} />
      </Button>

      <BottomSheet
        ref={sheetRef}
        index={-1}
        enablePanDownToClose
        enableDynamicSizing
        animationConfigs={{}}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.5} />
        )}
        backgroundStyle={{ backgroundColor: surface as string }}
        handleIndicatorStyle={{ backgroundColor: muted as string }}
      >
        <BottomSheetView>
          <CreateJournal onCreate={handleCreate} />
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}
