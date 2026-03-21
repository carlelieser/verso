import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  EMOTION_CATEGORIES,
  EMOTION_EMOJI_MAP,
  EMOTION_LABELS,
  SELECTED_EMOTION_COLOR,
  UNSELECTED_EMOTION_BACKGROUND,
} from '@/constants/emotions';
import { COLORS, RADII, SPACING } from '@/constants/theme';
import type { EmotionCategory } from '@/types/common';

interface EmotionWheelProps {
  readonly selectedCategories: readonly EmotionCategory[];
  readonly onToggle: (category: EmotionCategory) => void;
}

/**
 * A 2x5 grid of emotion chips. Each chip shows an emoji and label.
 * Selected chips have a gold fill; unselected chips have a dark card background.
 *
 * @param props.selectedCategories - Currently selected emotion categories
 * @param props.onToggle - Callback when an emotion chip is pressed
 */
export function EmotionWheel({ selectedCategories, onToggle }: EmotionWheelProps): React.JSX.Element {
  return (
    <View style={styles.grid}>
      {EMOTION_CATEGORIES.map((category) => {
        const isSelected = selectedCategories.includes(category);
        return (
          <Pressable
            key={category}
            style={[
              styles.chip,
              isSelected ? styles.chipSelected : styles.chipUnselected,
            ]}
            onPress={() => onToggle(category)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${EMOTION_LABELS[category]} emotion`}
          >
            <Text style={styles.emoji}>{EMOTION_EMOJI_MAP[category]}</Text>
            <Text
              style={[
                styles.label,
                isSelected ? styles.labelSelected : styles.labelUnselected,
              ]}
            >
              {EMOTION_LABELS[category]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const CHIP_GAP = SPACING.sm;

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CHIP_GAP,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADII.full,
    gap: SPACING.xs,
    minWidth: 110,
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: SELECTED_EMOTION_COLOR,
  },
  chipUnselected: {
    backgroundColor: UNSELECTED_EMOTION_BACKGROUND,
  },
  emoji: {
    fontSize: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  labelSelected: {
    color: COLORS.background,
  },
  labelUnselected: {
    color: COLORS.text.primary,
  },
});
