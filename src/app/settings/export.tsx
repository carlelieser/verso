import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/common/empty-state';
import { LoadingState } from '@/components/common/loading-state';
import { ExportSheet } from '@/components/export/export-sheet';
import { COLORS, RADII, SPACING } from '@/constants/theme';
import { useDatabaseContext } from '@/providers/database-provider';
import { createExportService } from '@/services/export-service';
import { createJournalService } from '@/services/journal-service';
import type { ExportFormat } from '@/types/common';
import type { Journal } from '@/types/journal';

export default function ExportScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { db } = useDatabaseContext();

  const journalService = useMemo(() => createJournalService(db), [db]);
  const exportService = useMemo(() => createExportService(db), [db]);

  const [journals, setJournals] = useState<readonly Journal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJournalId, setSelectedJournalId] = useState<string | undefined>(undefined);
  const [isSheetVisible, setIsSheetVisible] = useState(false);

  useEffect(() => {
    async function load(): Promise<void> {
      // Guest user ID is used as a fallback; the journal service handles auth context
      const result = await journalService.getAll('guest');
      setJournals(result);
      setIsLoading(false);
    }
    load();
  }, [journalService]);

  const handleJournalPress = useCallback((journalId: string) => {
    setSelectedJournalId(journalId);
    setIsSheetVisible(true);
  }, []);

  const handleDismiss = useCallback(() => {
    setIsSheetVisible(false);
    setSelectedJournalId(undefined);
  }, []);

  const handleExport = useCallback(
    async (scope: 'entry' | 'journal', format: ExportFormat) => {
      if (selectedJournalId === undefined) return;

      try {
        if (scope === 'journal') {
          const result = await exportService.exportJournal(selectedJournalId, format);
          await exportService.shareFile(result.uri);
        }
        handleDismiss();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Export failed';
        Alert.alert('Export Error', message);
      }
    },
    [selectedJournalId, exportService, handleDismiss],
  );

  if (isLoading) return <LoadingState />;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backButton}>{'<'}</Text>
        </Pressable>
        <Text style={styles.title}>Export Entries</Text>
        <View style={styles.headerSpacer} />
      </View>

      {journals.length === 0 ? (
        <EmptyState
          icon="📓"
          title="No journals"
          description="Create a journal first to export entries."
        />
      ) : (
        <FlatList
          data={journals}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              style={styles.journalRow}
              onPress={() => handleJournalPress(item.id)}
            >
              <Text style={styles.journalName}>{item.name}</Text>
              <Text style={styles.chevron}>{'>'}</Text>
            </Pressable>
          )}
          contentContainerStyle={styles.list}
        />
      )}

      <ExportSheet
        isVisible={isSheetVisible}
        onDismiss={handleDismiss}
        journalId={selectedJournalId}
        onExport={handleExport}
      />
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
  },
  headerSpacer: {
    width: 24,
  },
  list: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  journalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: RADII.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md + 2,
    marginBottom: SPACING.sm,
  },
  journalName: {
    fontSize: 16,
    color: COLORS.text.primary,
  },
  chevron: {
    fontSize: 16,
    color: COLORS.text.tertiary,
    fontWeight: '600',
  },
});
