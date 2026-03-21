import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS, RADII, SPACING } from '@/constants/theme';
import type { Journal } from '@/types/journal';
import { formatDate } from '@/utils/date';

interface JournalCardProps {
  readonly journal: Journal;
  readonly entryCount?: number;
  readonly lastEntryDate?: number;
  readonly onPress: () => void;
  readonly onLongPress?: () => void;
}

export function JournalCard({
  journal,
  entryCount = 0,
  lastEntryDate,
  onPress,
  onLongPress,
}: JournalCardProps): React.JSX.Element {
  return (
    <Pressable style={styles.card} onPress={onPress} onLongPress={onLongPress} accessibilityRole="button" accessibilityLabel={`Journal: ${journal.name}`}>
      <Text style={styles.name} numberOfLines={1}>
        {journal.name}
      </Text>
      <View style={styles.meta}>
        <Text style={styles.metaText}>
          {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
        </Text>
        {lastEntryDate ? (
          <Text style={styles.metaText}>{formatDate(lastEntryDate)}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
});
