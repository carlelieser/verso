import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS, RADII, SPACING } from '@/constants/theme';
import type { StreakData } from '@/types/emotion';

interface StreakCounterProps {
  readonly streakData: StreakData;
}

/**
 * Displays current and longest journaling streaks as two side-by-side stat cards,
 * with an encouraging message below sourced from the streak calculation.
 *
 * @param props.streakData - Streak statistics including current, longest, and message
 */
export function StreakCounter({ streakData }: StreakCounterProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <View style={styles.cardsRow}>
        <View style={styles.card}>
          <Text style={styles.statNumber}>{streakData.currentStreak}</Text>
          <Text style={styles.statLabel}>Current Streak</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.statNumber}>{streakData.longestStreak}</Text>
          <Text style={styles.statLabel}>Longest Streak</Text>
        </View>
      </View>
      {streakData.encouragingMessage.length > 0 ? (
        <Text style={styles.encouragement}>{streakData.encouragingMessage}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADII.lg,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.accent,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },
  encouragement: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: SPACING.lg,
  },
});
