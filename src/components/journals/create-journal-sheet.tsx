import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { COLORS, RADII, SPACING } from '@/constants/theme';

interface CreateJournalSheetProps {
  readonly isVisible: boolean;
  readonly onDismiss: () => void;
  readonly onCreate: (name: string) => void;
}

export function CreateJournalSheet({
  isVisible,
  onDismiss,
  onCreate,
}: CreateJournalSheetProps): React.JSX.Element | null {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [name, setName] = useState('');

  const handleCreate = useCallback(() => {
    const trimmed = name.trim();
    if (trimmed.length > 0) {
      onCreate(trimmed);
      setName('');
      bottomSheetRef.current?.close();
    }
  }, [name, onCreate]);

  if (!isVisible) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={['35%']}
      enablePanDownToClose
      onClose={onDismiss}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.indicator}
    >
      <BottomSheetView style={styles.content}>
        <Text style={styles.title}>New Journal</Text>
        <TextInput
          style={styles.input}
          placeholder="Journal name"
          placeholderTextColor={COLORS.text.tertiary}
          value={name}
          onChangeText={setName}
          autoFocus
          maxLength={100}
        />
        <Pressable
          style={[styles.button, name.trim().length === 0 && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={name.trim().length === 0}
        >
          <Text style={styles.buttonText}>Create</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: COLORS.card,
  },
  indicator: {
    backgroundColor: COLORS.text.tertiary,
  },
  content: {
    padding: SPACING['2xl'],
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.lg,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: RADII.md,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.text.primary,
    marginBottom: SPACING.lg,
  },
  button: {
    backgroundColor: COLORS.accent,
    borderRadius: RADII.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '600',
  },
});
