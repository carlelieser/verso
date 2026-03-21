import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, RADII, SPACING } from '@/constants/theme';

interface OnboardingStep {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
}

const STEPS: readonly OnboardingStep[] = [
  {
    icon: '✍️',
    title: 'Write Freely',
    description: 'A distraction-free editor with rich formatting, voice dictation, and inline photos.',
  },
  {
    icon: '🎭',
    title: 'Track Your Emotions',
    description: 'Select emotions and intensity after each entry to build self-awareness over time.',
  },
  {
    icon: '📊',
    title: 'Discover Insights',
    description: 'View mood trends, streaks, and emotional patterns on your personal dashboard.',
  },
];

export default function OnboardingScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);

  const step = STEPS[currentStep];

  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      router.replace('/(tabs)');
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    router.replace('/(tabs)');
  }, []);

  if (!step) {
    router.replace('/(tabs)');
    return <View />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.skipRow}>
        <Pressable onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.icon}>{step.icon}</Text>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.description}>{step.description}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {STEPS.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, index === currentStep ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>

        <Pressable style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentStep === STEPS.length - 1 ? 'Get Started' : 'Next'}
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
    paddingHorizontal: SPACING.lg,
  },
  skipRow: {
    alignItems: 'flex-end',
    paddingVertical: SPACING.md,
  },
  skipText: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING['2xl'],
  },
  icon: {
    fontSize: 64,
    marginBottom: SPACING['2xl'],
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    alignItems: 'center',
    gap: SPACING['2xl'],
    paddingBottom: SPACING['2xl'],
  },
  dots: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: COLORS.accent,
  },
  dotInactive: {
    backgroundColor: COLORS.border,
  },
  nextButton: {
    width: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: RADII.xl,
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.background,
  },
});
