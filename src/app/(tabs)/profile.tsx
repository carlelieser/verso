import { router } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, RADII, SPACING } from '@/constants/theme';

interface SettingsRowProps {
  readonly label: string;
  readonly onPress: () => void;
}

function SettingsRow({ label, onPress }: SettingsRowProps): React.JSX.Element {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowChevron}>{'>'}</Text>
    </Pressable>
  );
}

interface SectionProps {
  readonly title: string;
  readonly children: React.ReactNode;
}

function Section({ title, children }: SectionProps): React.JSX.Element {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function showPlaceholderAlert(feature: string): void {
  Alert.alert('Coming Soon', `${feature} will be available in a future update.`);
}

export default function ProfileScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarPlaceholder} />
        <View style={styles.profileInfo}>
          <Text style={styles.name}>Guest User</Text>
          <Text style={styles.subtitle}>Sign up to sync across devices</Text>
        </View>
      </View>

      <Section title="JOURNAL">
        <SettingsRow
          label="Writing Reminders"
          onPress={() => router.push('/settings/reminders')}
        />
        <View style={styles.separator} />
        <SettingsRow
          label="Export Entries"
          onPress={() => showPlaceholderAlert('Export Entries')}
        />
      </Section>

      <Section title="APP">
        <SettingsRow
          label="Appearance"
          onPress={() => showPlaceholderAlert('Appearance')}
        />
        <View style={styles.separator} />
        <SettingsRow
          label="Notifications"
          onPress={() => showPlaceholderAlert('Notifications')}
        />
      </Section>

      <Section title="ACCOUNT">
        <SettingsRow
          label="Sign In / Create Account"
          onPress={() => router.push('/auth/welcome')}
        />
      </Section>
    </ScrollView>
  );
}

const AVATAR_SIZE = 56;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: SPACING['4xl'],
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    borderRadius: RADII.lg,
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: COLORS.border,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  section: {
    marginTop: SPACING['2xl'],
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  sectionCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    borderRadius: RADII.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md + 2,
  },
  rowLabel: {
    fontSize: 16,
    color: COLORS.text.primary,
  },
  rowChevron: {
    fontSize: 16,
    color: COLORS.text.tertiary,
    fontWeight: '600',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.lg,
  },
});
