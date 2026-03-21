import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, RADII, SPACING } from '@/constants/theme';
import { useReminder } from '@/hooks/use-reminder';

function formatTimeDisplay(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayMinute = String(minute).padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}

function wrapHour(value: number): number {
  return ((value % 24) + 24) % 24;
}

function wrapMinute(value: number): number {
  return ((value % 60) + 60) % 60;
}

const NOTIFICATION_PREVIEW = 'Time to reflect on your day. Open your journal and write a few thoughts.';

export default function RemindersScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { isEnabled, hour, minute, isLoading, setReminder, disable } = useReminder();

  const [localHour, setLocalHour] = useState<number | null>(null);
  const [localMinute, setLocalMinute] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const displayHour = localHour ?? hour;
  const displayMinute = localMinute ?? minute;

  const hasUnsavedChanges = localHour !== null || localMinute !== null;

  const handleToggle = useCallback(
    async (value: boolean) => {
      if (value) {
        await setReminder({ hour: displayHour, minute: displayMinute });
      } else {
        await disable();
      }
    },
    [displayHour, displayMinute, setReminder, disable],
  );

  const handleIncrementHour = useCallback(() => {
    setLocalHour(wrapHour((localHour ?? hour) + 1));
  }, [localHour, hour]);

  const handleDecrementHour = useCallback(() => {
    setLocalHour(wrapHour((localHour ?? hour) - 1));
  }, [localHour, hour]);

  const handleIncrementMinute = useCallback(() => {
    const next = wrapMinute((localMinute ?? minute) + 5);
    setLocalMinute(next);
  }, [localMinute, minute]);

  const handleDecrementMinute = useCallback(() => {
    const next = wrapMinute((localMinute ?? minute) - 5);
    setLocalMinute(next);
  }, [localMinute, minute]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await setReminder({ hour: displayHour, minute: displayMinute });
      setLocalHour(null);
      setLocalMinute(null);
      router.back();
    } finally {
      setIsSaving(false);
    }
  }, [displayHour, displayMinute, setReminder]);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backButton}>{'< Back'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Writing Reminders</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Enable Reminders</Text>
          <Switch
            value={isEnabled}
            onValueChange={handleToggle}
            trackColor={{ false: COLORS.border, true: COLORS.accent }}
            thumbColor={COLORS.text.primary}
          />
        </View>
      </View>

      <View style={[styles.card, !isEnabled && styles.cardDisabled]}>
        <Text style={styles.timeLabel}>Reminder Time</Text>
        <Text style={styles.timeDisplay}>
          {formatTimeDisplay(displayHour, displayMinute)}
        </Text>

        <View style={styles.pickerContainer}>
          <View style={styles.pickerColumn}>
            <Text style={styles.pickerLabel}>Hour</Text>
            <View style={styles.pickerControls}>
              <Pressable
                style={styles.pickerButton}
                onPress={handleIncrementHour}
                disabled={!isEnabled}
              >
                <Text style={[styles.pickerButtonText, !isEnabled && styles.textDisabled]}>+</Text>
              </Pressable>
              <Text style={[styles.pickerValue, !isEnabled && styles.textDisabled]}>
                {String(displayHour % 12 === 0 ? 12 : displayHour % 12)}
              </Text>
              <Pressable
                style={styles.pickerButton}
                onPress={handleDecrementHour}
                disabled={!isEnabled}
              >
                <Text style={[styles.pickerButtonText, !isEnabled && styles.textDisabled]}>-</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.pickerColumn}>
            <Text style={styles.pickerLabel}>Minute</Text>
            <View style={styles.pickerControls}>
              <Pressable
                style={styles.pickerButton}
                onPress={handleIncrementMinute}
                disabled={!isEnabled}
              >
                <Text style={[styles.pickerButtonText, !isEnabled && styles.textDisabled]}>+</Text>
              </Pressable>
              <Text style={[styles.pickerValue, !isEnabled && styles.textDisabled]}>
                {String(displayMinute).padStart(2, '0')}
              </Text>
              <Pressable
                style={styles.pickerButton}
                onPress={handleDecrementMinute}
                disabled={!isEnabled}
              >
                <Text style={[styles.pickerButtonText, !isEnabled && styles.textDisabled]}>-</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.pickerColumn}>
            <Text style={styles.pickerLabel}>Period</Text>
            <Text style={[styles.periodDisplay, !isEnabled && styles.textDisabled]}>
              {displayHour >= 12 ? 'PM' : 'AM'}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.card, !isEnabled && styles.cardDisabled]}>
        <Text style={styles.previewLabel}>Notification Preview</Text>
        <Text style={[styles.previewText, !isEnabled && styles.textDisabled]}>
          {NOTIFICATION_PREVIEW}
        </Text>
      </View>

      <Pressable
        style={[
          styles.saveButton,
          (!hasUnsavedChanges || isSaving) && styles.saveButtonDisabled,
        ]}
        onPress={handleSave}
        disabled={!hasUnsavedChanges || isSaving}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color={COLORS.background} />
        ) : (
          <Text
            style={[
              styles.saveButtonText,
              (!hasUnsavedChanges || isSaving) && styles.saveButtonTextDisabled,
            ]}
          >
            Save
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    fontSize: 16,
    color: COLORS.accent,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  headerSpacer: {
    width: 50,
  },
  card: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: RADII.lg,
    padding: SPACING.lg,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    fontSize: 16,
    color: COLORS.text.primary,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  timeDisplay: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING['3xl'],
  },
  pickerColumn: {
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  pickerControls: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  pickerButton: {
    width: 40,
    height: 40,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  pickerValue: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  periodDisplay: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginTop: SPACING.sm + SPACING.sm + 40,
  },
  textDisabled: {
    color: COLORS.text.tertiary,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  previewText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: COLORS.accent,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING['2xl'],
    borderRadius: RADII.lg,
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.background,
  },
  saveButtonTextDisabled: {
    color: COLORS.text.tertiary,
  },
});
