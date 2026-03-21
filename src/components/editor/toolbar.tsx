import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS, RADII, SPACING } from '@/constants/theme';
import { pickImage } from '@/utils/image';

import type { EditorRef } from './editor';

interface ToolbarProps {
  readonly editorRef: React.RefObject<EditorRef | null>;
}

interface ToolbarButton {
  readonly label: string;
  readonly action: (editor: EditorRef) => void;
}

const BUTTONS: readonly ToolbarButton[] = [
  { label: 'B', action: (e) => e.toggleBold() },
  { label: 'I', action: (e) => e.toggleItalic() },
  { label: 'H', action: (e) => e.toggleHeading(2) },
  { label: '•', action: (e) => e.toggleBulletList() },
  { label: '1.', action: (e) => e.toggleOrderedList() },
  { label: '"', action: (e) => e.toggleBlockquote() },
];

export function Toolbar({ editorRef }: ToolbarProps): React.JSX.Element {
  const handlePress = useCallback(
    (action: (editor: EditorRef) => void) => {
      if (editorRef.current) {
        action(editorRef.current);
      }
    },
    [editorRef],
  );

  const handleImagePick = useCallback(async () => {
    const uri = await pickImage();
    if (uri && editorRef.current) {
      editorRef.current.setImage(uri);
    }
  }, [editorRef]);

  return (
    <View style={styles.toolbar}>
      {BUTTONS.map((btn) => (
        <Pressable
          key={btn.label}
          style={styles.button}
          onPress={() => handlePress(btn.action)}
        >
          <Text style={styles.buttonText}>{btn.label}</Text>
        </Pressable>
      ))}
      <Pressable style={styles.button} onPress={handleImagePick}>
        <Text style={styles.buttonText}>🖼</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: RADII.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: RADII.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: COLORS.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
