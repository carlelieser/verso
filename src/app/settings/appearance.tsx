import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, RADII, SPACING } from '@/constants/theme';
import { useThemeContext } from '@/providers/theme-provider';

export default function AppearanceScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { mode, setTheme } = useThemeContext();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backButton}>{'<'}</Text>
        </Pressable>
        <Text style={styles.title}>Appearance</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.optionGroup}>
        <Pressable
          style={[styles.option, mode === 'dark' ? styles.optionActive : undefined]}
          onPress={() => setTheme('dark')}
        >
          <Text style={styles.optionLabel}>Dark</Text>
          {mode === 'dark' ? <Text style={styles.checkmark}>✓</Text> : null}
        </Pressable>

        <View style={styles.separator} />

        <Pressable
          style={[styles.option, mode === 'light' ? styles.optionActive : undefined]}
          onPress={() => setTheme('light')}
        >
          <Text style={styles.optionLabel}>Light</Text>
          {mode === 'light' ? <Text style={styles.checkmark}>✓</Text> : null}
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
    paddingVertical: SPACING.md,
  },
  backButton: {
    fontSize: 24,
    color: COLORS.text.primary,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  headerSpacer: {
    width: 24,
  },
  optionGroup: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: RADII.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md + 2,
  },
  optionActive: {
    // visual distinction handled by checkmark
  },
  optionLabel: {
    fontSize: 16,
    color: COLORS.text.primary,
  },
  checkmark: {
    fontSize: 16,
    color: COLORS.accent,
    fontWeight: '600',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.lg,
  },
});
