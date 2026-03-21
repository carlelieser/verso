import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EMOTION_COLOR_MAP, EMOTION_EMOJI_MAP, EMOTION_LABELS } from '@/constants/emotions';
import { COLORS, RADII, SPACING } from '@/constants/theme';
import type { EmotionCategory } from '@/types/common';
import type { Entry } from '@/types/entry';
import { formatDate } from '@/utils/date';

interface EntryCardProps {
  readonly entry: Entry;
  readonly dominantEmotion?: { readonly category: EmotionCategory; readonly intensity: number };
  readonly onPress: () => void;
}

function getWordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * A card that displays a journal entry summary with optional mood pill.
 *
 * @param props - The entry data, optional dominant emotion, and press handler
 * @returns A pressable card element
 */
export function EntryCard({ entry, dominantEmotion, onPress }: EntryCardProps): React.JSX.Element {
  const wordCount = getWordCount(entry.contentText);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.topRow}>
        <Text style={styles.date}>{formatDate(entry.createdAt)}</Text>
        {dominantEmotion !== undefined ? (
          <View
            style={[
              styles.moodPill,
              { backgroundColor: `${EMOTION_COLOR_MAP[dominantEmotion.category]}20` },
            ]}
          >
            <Text style={styles.moodEmoji}>
              {EMOTION_EMOJI_MAP[dominantEmotion.category]}
            </Text>
            <Text
              style={[
                styles.moodLabel,
                { color: EMOTION_COLOR_MAP[dominantEmotion.category] },
              ]}
            >
              {EMOTION_LABELS[dominantEmotion.category]}
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.preview} numberOfLines={2}>
        {entry.contentText || 'Empty entry'}
      </Text>

      <Text style={styles.wordCount}>
        {wordCount} {wordCount === 1 ? 'word' : 'words'}
      </Text>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  date: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  moodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADII.full,
    gap: 4,
  },
  moodEmoji: {
    fontSize: 12,
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  preview: {
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
