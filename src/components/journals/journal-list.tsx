import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/common/empty-state';
import { SPACING } from '@/constants/theme';
import type { Journal } from '@/types/journal';

import { JournalCard } from './journal-card';

interface JournalListProps {
  readonly journals: readonly Journal[];
  readonly onJournalPress: (journal: Journal) => void;
  readonly onJournalLongPress?: (journal: Journal) => void;
  readonly onCreatePress: () => void;
}

export function JournalList({
  journals,
  onJournalPress,
  onJournalLongPress,
  onCreatePress,
}: JournalListProps): React.JSX.Element {
  if (journals.length === 0) {
    return (
      <EmptyState
        icon="📓"
        title="No journals yet"
        description="Create your first journal to start writing."
        ctaLabel="New Journal"
        onCtaPress={onCreatePress}
      />
    );
  }

  return (
    <FlatList
      data={journals}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <JournalCard
          journal={item}
          onPress={() => onJournalPress(item)}
          onLongPress={onJournalLongPress ? () => onJournalLongPress(item) : undefined}
        />
      )}
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  separator: {
    height: SPACING.xs,
  },
});
