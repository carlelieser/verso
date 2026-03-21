import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/common/empty-state';
import { LoadingState } from '@/components/common/loading-state';
import { COLORS, RADII, SPACING } from '@/constants/theme';
import { useDatabaseContext } from '@/providers/database-provider';
import { createEntryService } from '@/services/entry-service';
import { createJournalService } from '@/services/journal-service';
import type { Entry } from '@/types/entry';
import { formatDate } from '@/utils/date';

export default function JournalTimelineScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { db } = useDatabaseContext();

  const journalService = useMemo(() => createJournalService(db), [db]);
  const entryService = useMemo(() => createEntryService(db), [db]);

  const [journalName, setJournalName] = useState('');
  const [entries, setEntries] = useState<readonly Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load(): Promise<void> {
      if (!id) return;
      const journal = await journalService.getById(id);
      if (journal) setJournalName(journal.name);
      const result = await entryService.getByJournal(id, { limit: 50 });
      setEntries(result);
      setIsLoading(false);
    }
    load();
  }, [id, journalService, entryService]);

  const handleNewEntry = useCallback(async () => {
    if (!id) return;
    const entry = await entryService.create({ journalId: id });
    router.push(`/entry/${entry.id}`);
  }, [id, entryService]);

  const handleEntryPress = useCallback((entry: Entry) => {
    router.push(`/entry/${entry.id}`);
  }, []);

  if (isLoading) return <LoadingState />;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>{journalName}</Text>
        <Pressable onPress={handleNewEntry}>
          <Text style={styles.newButton}>+</Text>
        </Pressable>
      </View>

      {entries.length === 0 ? (
        <EmptyState
          icon="✏️"
          title="No entries yet"
          description="Tap + to write your first entry."
          ctaLabel="New Entry"
          onCtaPress={handleNewEntry}
        />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable style={styles.entryCard} onPress={() => handleEntryPress(item)}>
              <Text style={styles.entryDate}>{formatDate(item.createdAt)}</Text>
              <Text style={styles.entryPreview} numberOfLines={2}>
                {item.contentText || 'Empty entry'}
              </Text>
              <Text style={styles.wordCount}>
                {item.contentText.split(/\s+/).filter(Boolean).length} words
              </Text>
            </Pressable>
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    fontSize: 24,
    color: COLORS.text.primary,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: SPACING.md,
  },
  newButton: {
    fontSize: 28,
    color: COLORS.accent,
    fontWeight: '300',
  },
  list: {
    paddingHorizontal: SPACING.lg,
  },
  entryCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  entryDate: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  entryPreview: {
    fontSize: 16,
    color: COLORS.text.primary,
    lineHeight: 22,
  },
  wordCount: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    marginTop: SPACING.sm,
  },
});
