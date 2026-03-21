import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EMOTION_COLOR_MAP } from '@/constants/emotions';
import { COLORS, RADII, SPACING } from '@/constants/theme';
import type { EmotionCategory } from '@/types/common';

const TODAY_HIGHLIGHT_COLOR = '#C9A962';
const DOT_SIZE = 6;

interface DayCellProps {
  readonly date: string;
  readonly dayNumber: string;
  readonly isToday: boolean;
  readonly isSelected: boolean;
  readonly isDisabled: boolean;
  readonly dominantEmotion: EmotionCategory | undefined;
  readonly onPress: (date: string) => void;
}

/**
 * Custom day cell for the mood calendar.
 * Renders the day number with an optional mood-colored dot beneath it
 * and highlights for today / selected state.
 */
export function DayCell({
  date,
  dayNumber,
  isToday,
  isSelected,
  isDisabled,
  dominantEmotion,
  onPress,
}: DayCellProps): React.JSX.Element {
  const dotColor = dominantEmotion ? EMOTION_COLOR_MAP[dominantEmotion] : undefined;

  const handlePress = (): void => {
    if (!isDisabled) {
      onPress(date);
    }
  };

  return (
    <Pressable
      style={[
        styles.container,
        isSelected && styles.selectedContainer,
        isToday && !isSelected && styles.todayContainer,
      ]}
      onPress={handlePress}
      disabled={isDisabled}
      accessibilityLabel={`${dayNumber}${isToday ? ', today' : ''}${dominantEmotion ? `, mood: ${dominantEmotion}` : ''}`}
      accessibilityRole="button"
    >
      <Text
        style={[
          styles.dayText,
          isDisabled && styles.disabledText,
          isSelected && styles.selectedText,
          isToday && !isSelected && styles.todayText,
        ]}
      >
        {dayNumber}
      </Text>
      <View style={styles.dotContainer}>
        {dotColor ? (
          <View style={[styles.dot, { backgroundColor: dotColor }]} />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 42,
    borderRadius: RADII.md,
  },
  selectedContainer: {
    backgroundColor: COLORS.accent,
  },
  todayContainer: {
    borderWidth: 1,
    borderColor: TODAY_HIGHLIGHT_COLOR,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.text.primary,
  },
  disabledText: {
    color: COLORS.text.tertiary,
  },
  selectedText: {
    color: COLORS.background,
    fontWeight: '600',
  },
  todayText: {
    color: TODAY_HIGHLIGHT_COLOR,
    fontWeight: '600',
  },
  dotContainer: {
    height: DOT_SIZE + SPACING.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: RADII.full,
  },
});
