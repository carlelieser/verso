import { router } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/common/empty-state';
import { COLORS } from '@/constants/theme';
import { useJournals } from '@/hooks/use-journals';
import { useEntries } from '@/hooks/use-entries';

export default function WriteScreen(): React.JSX.Element {
  const { journals } = useJournals();
  const firstJournal = journals[0];
  const { createEntry } = useEntries(firstJournal?.id ?? null);

  const handleNewEntry = useCallback(async () => {
    if (!firstJournal) return;
    const entry = await createEntry(firstJournal.id);
    router.push(`/entry/${entry.id}`);
  }, [firstJournal, createEntry]);

  useEffect(() => {
    if (firstJournal) {
      handleNewEntry();
    }
  }, []);

  if (!firstJournal) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="✏️"
          title="Create a journal first"
          description="Go to the Home tab to create your first journal, then start writing."
        />
      </View>
    );
  }

  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
