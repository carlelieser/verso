import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  EMOTION_EMOJI_MAP,
  EMOTION_LABELS,
  INTENSITY_LABELS,
  SELECTED_EMOTION_COLOR,
} from '@/constants/emotions';
import { COLORS, RADII, SPACING } from '@/constants/theme';
import type { EmotionCategory, EmotionIntensity } from '@/types/common';

interface IntensitySliderProps {
  readonly category: EmotionCategory;
  readonly intensity: EmotionIntensity;
  readonly onIntensityChange: (category: EmotionCategory, intensity: EmotionIntensity) => void;
}

const INTENSITY_STEPS: readonly EmotionIntensity[] = [1, 2, 3, 4, 5];

/**
 * Displays an emoji, label, current value label, and a row of tappable
 * intensity dots (1-5) for adjusting emotion intensity.
 *
 * @param props.category - The emotion category to display
 * @param props.intensity - Current intensity value (1-5)
 * @param props.onIntensityChange - Callback when intensity changes
 */
export function IntensitySlider({
  category,
  intensity,
  onIntensityChange,
}: IntensitySliderProps): React.JSX.Element {
  const intensityLabel = INTENSITY_LABELS[intensity] ?? '';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{EMOTION_EMOJI_MAP[category]}</Text>
        <Text style={styles.label}>{EMOTION_LABELS[category]}</Text>
        <Text style={styles.value}>
          {intensity} - {intensityLabel}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={styles.trackLine}>
          <View
            style={[
              styles.trackFill,
              { width: `${((intensity - 1) / 4) * 100}%` },
            ]}
          />
        </View>
        <View style={styles.stepsRow}>
          {INTENSITY_STEPS.map((step) => {
            const isActive = step <= intensity;
            return (
              <Pressable
                key={step}
                style={[styles.stepButton, isActive ? styles.stepActive : styles.stepInactive]}
                onPress={() => onIntensityChange(category, step)}
                accessibilityRole="button"
                accessibilityLabel={`Set ${EMOTION_LABELS[category]} intensity to ${step}`}
              >
                <Text style={[styles.stepText, isActive ? styles.stepTextActive : styles.stepTextInactive]}>
                  {step}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const STEP_SIZE = 32;

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  emoji: {
    fontSize: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.primary,
    flex: 1,
  },
  value: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  track: {
    position: 'relative',
  },
  trackLine: {
    position: 'absolute',
    top: STEP_SIZE / 2 - 2,
    left: STEP_SIZE / 2,
    right: STEP_SIZE / 2,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: RADII.full,
  },
  trackFill: {
    height: 4,
    backgroundColor: SELECTED_EMOTION_COLOR,
    borderRadius: RADII.full,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepButton: {
    width: STEP_SIZE,
    height: STEP_SIZE,
    borderRadius: RADII.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepActive: {
    backgroundColor: SELECTED_EMOTION_COLOR,
  },
  stepInactive: {
    backgroundColor: COLORS.border,
  },
  stepText: {
    fontSize: 13,
    fontWeight: '600',
  },
  stepTextActive: {
    color: COLORS.background,
  },
  stepTextInactive: {
    color: COLORS.text.secondary,
  },
});
