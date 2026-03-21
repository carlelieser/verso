import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmotionWheel } from '@/components/emotions/emotion-wheel';
import { IntensitySlider } from '@/components/emotions/intensity-slider';
import { COLORS, RADII, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { useEmotions } from '@/hooks/use-emotions';

export default function EmotionsScreen(): React.JSX.Element {
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const insets = useSafeAreaInsets();

  const {
    selectedEmotions,
    isSaving,
    toggleEmotion,
    setIntensity,
    saveEmotions,
  } = useEmotions(entryId ?? null);

  const selectedCategories = selectedEmotions.map((e) => e.category);
  const hasSelections = selectedEmotions.length > 0;

  const handleSkip = useCallback((): void => {
    router.back();
  }, []);

  const handleSave = useCallback(async (): Promise<void> => {
    await saveEmotions();
    router.back();
  }, [saveEmotions]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>How are you feeling?</Text>
        <Pressable onPress={handleSkip} hitSlop={8}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Select your emotions</Text>
        <EmotionWheel selectedCategories={selectedCategories} onToggle={toggleEmotion} />

        {hasSelections ? (
          <View style={styles.slidersSection}>
            <Text style={styles.sectionLabel}>Adjust intensity</Text>
            <View style={styles.slidersList}>
              {selectedEmotions.map((emotion) => (
                <IntensitySlider
                  key={emotion.category}
                  category={emotion.category}
                  intensity={emotion.intensity}
                  onIntensityChange={setIntensity}
                />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.lg }]}>
        <Pressable
          style={[styles.saveButton, !hasSelections && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!hasSelections || isSaving}
        >
          <Text style={[styles.saveButtonText, !hasSelections && styles.saveButtonTextDisabled]}>
            {isSaving ? 'Saving...' : 'Save Emotions'}
          </Text>
        </Pressable>
      </View>
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
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  skipText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: SPACING.lg,
    gap: SPACING.lg,
  },
  sectionLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: SPACING.lg,
  },
  slidersSection: {
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  slidersList: {
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  saveButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.lg,
    borderRadius: RADII.lg,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.card,
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.background,
  },
  saveButtonTextDisabled: {
    color: COLORS.text.tertiary,
  },
});
