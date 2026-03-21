import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS, RADII, SPACING } from '@/constants/theme';
import type { ExportFormat } from '@/types/common';

type ExportScope = 'entry' | 'journal';

interface ExportSheetProps {
  readonly isVisible: boolean;
  readonly onDismiss: () => void;
  readonly entryId?: string;
  readonly journalId?: string;
  readonly onExport: (scope: ExportScope, format: ExportFormat) => Promise<void>;
}

const FORMAT_OPTIONS: readonly { readonly value: ExportFormat; readonly label: string }[] = [
  { value: 'pdf', label: 'PDF' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'json', label: 'JSON' },
] as const;

/**
 * A bottom sheet that provides export scope and format selection.
 *
 * @param props - Visibility state, dismiss handler, context IDs, and export handler
 * @returns A bottom sheet element for export configuration
 */
export function ExportSheet({
  isVisible,
  onDismiss,
  entryId,
  journalId,
  onExport,
}: ExportSheetProps): React.JSX.Element | null {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['50%'], []);

  const hasJournalOption = journalId !== undefined;
  const hasEntryOption = entryId !== undefined;

  const defaultScope: ExportScope = hasEntryOption ? 'entry' : 'journal';
  const [selectedScope, setSelectedScope] = useState<ExportScope>(defaultScope);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isVisible]);

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        onDismiss();
      }
    },
    [onDismiss],
  );

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      await onExport(selectedScope, selectedFormat);
    } finally {
      setIsExporting(false);
    }
  }, [onExport, selectedScope, selectedFormat]);

  const renderBackdrop = useCallback(
    (props: Record<string, unknown>) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    [],
  );

  if (!isVisible) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onChange={handleSheetChange}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.content}>
        <Text style={styles.title}>Export</Text>

        {hasEntryOption && hasJournalOption ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Scope</Text>
            <View style={styles.toggleRow}>
              <Pressable
                style={[styles.toggleOption, selectedScope === 'entry' && styles.toggleOptionActive]}
                onPress={() => setSelectedScope('entry')}
              >
                <Text
                  style={[
                    styles.toggleText,
                    selectedScope === 'entry' && styles.toggleTextActive,
                  ]}
                >
                  Current Entry
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.toggleOption,
                  selectedScope === 'journal' && styles.toggleOptionActive,
                ]}
                onPress={() => setSelectedScope('journal')}
              >
                <Text
                  style={[
                    styles.toggleText,
                    selectedScope === 'journal' && styles.toggleTextActive,
                  ]}
                >
                  Entire Journal
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Format</Text>
          {FORMAT_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={styles.radioRow}
              onPress={() => setSelectedFormat(option.value)}
            >
              <View style={styles.radioOuter}>
                {selectedFormat === option.value ? <View style={styles.radioInner} /> : null}
              </View>
              <Text style={styles.radioLabel}>{option.label}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
          onPress={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <ActivityIndicator color={COLORS.background} />
          ) : (
            <Text style={styles.exportButtonText}>Export</Text>
          )}
        </Pressable>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: COLORS.card,
  },
  handleIndicator: {
    backgroundColor: COLORS.text.tertiary,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING['4xl'],
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: RADII.md,
    padding: SPACING.xs,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADII.sm,
  },
  toggleOptionActive: {
    backgroundColor: COLORS.accent,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },
  toggleTextActive: {
    color: COLORS.background,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.text.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.accent,
  },
  radioLabel: {
    fontSize: 16,
    color: COLORS.text.primary,
  },
  exportButton: {
    backgroundColor: COLORS.accent,
    borderRadius: RADII.lg,
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.background,
  },
});
