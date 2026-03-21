import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, RADII, SPACING, TYPOGRAPHY } from '@/constants/theme';

const FEATURE_HIGHLIGHTS = [
  'Capture your thoughts with rich text and voice',
  'Track emotions and discover patterns over time',
  'Gain AI-powered insights into your well-being',
] as const;

export default function WelcomeScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.logoSection}>
        <Text style={styles.logoText}>Verso</Text>
        <Text style={styles.tagline}>Your private journal</Text>
      </View>

      <View style={styles.featuresSection}>
        {FEATURE_HIGHLIGHTS.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <View style={styles.featureBullet} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actionsSection}>
        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
          onPress={() => router.push('/auth/sign-up')}
        >
          <Text style={styles.primaryButtonText}>Create Account</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          onPress={() => router.replace('/(tabs)/')}
        >
          <Text style={styles.secondaryButtonText}>Continue as Guest</Text>
        </Pressable>

        <Pressable onPress={() => router.push('/auth/sign-in')}>
          <Text style={styles.signInLink}>
            Already have an account? <Text style={styles.signInLinkAccent}>Sign In</Text>
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
    paddingHorizontal: SPACING['2xl'],
    justifyContent: 'space-between',
  },
  logoSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: TYPOGRAPHY.fontSize['4xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.accent,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
    marginTop: SPACING.sm,
  },
  featuresSection: {
    gap: SPACING.lg,
    paddingVertical: SPACING['3xl'],
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  featureBullet: {
    width: 8,
    height: 8,
    borderRadius: RADII.full,
    backgroundColor: COLORS.accent,
  },
  featureText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.primary,
    lineHeight: 22,
  },
  actionsSection: {
    gap: SPACING.md,
    paddingBottom: SPACING['3xl'],
  },
  primaryButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.lg,
    borderRadius: RADII.lg,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.background,
  },
  secondaryButton: {
    backgroundColor: COLORS.card,
    paddingVertical: SPACING.lg,
    borderRadius: RADII.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  signInLink: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },
  signInLinkAccent: {
    color: COLORS.accent,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
});
