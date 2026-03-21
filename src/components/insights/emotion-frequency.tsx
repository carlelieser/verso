import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { EMOTION_EMOJI_MAP, EMOTION_LABELS } from '@/constants/emotions';
import { COLORS, RADII, SPACING } from '@/constants/theme';
import type { EmotionRanking } from '@/types/emotion';

interface EmotionFrequencyProps {
  readonly data: readonly EmotionRanking[];
}

const MAX_PERCENTAGE = 100;
const BAR_BACKGROUND = '#2A2A2C';

/**
 * Ranked list of emotions showing emoji, label, and a percentage fill bar.
 * The gold bar width is proportional to the emotion's relative frequency.
 *
 * @param props.data - Ranked emotion data sorted by frequency
 */
export function EmotionFrequency({ data }: EmotionFrequencyProps): React.JSX.Element {
  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No emotion data yet</Text>
      </View>
    );
  }

  const maxCount = data.reduce((max, item) => Math.max(max, item.count), 0);

  return (
    <View style={styles.container}>
      {data.map((ranking) => {
        const percentage = maxCount > 0
          ? Math.round((ranking.count / maxCount) * MAX_PERCENTAGE)
          : 0;

        return (
          <View key={ranking.category} style={styles.row}>
            <View style={styles.labelSection}>
              <Text style={styles.emoji}>{EMOTION_EMOJI_MAP[ranking.category]}</Text>
              <Text style={styles.label} numberOfLines={1}>
                {EMOTION_LABELS[ranking.category]}
              </Text>
            </View>
            <View style={styles.barSection}>
              <View style={styles.barTrack}>
                <View
                  style={[styles.barFill, { width: `${String(percentage)}%` as `${number}%` }]}
                />
              </View>
              <Text style={styles.percentage}>
                {String(ranking.count)}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  },
  emptyContainer: {
    paddingVertical: SPACING['2xl'],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  labelSection: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 110,
    gap: SPACING.sm,
  },
  emoji: {
    fontSize: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
    flexShrink: 1,
  },
  barSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: BAR_BACKGROUND,
    borderRadius: RADII.sm,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: RADII.sm,
  },
  percentage: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.secondary,
    width: 32,
    textAlign: 'right',
  },
});
