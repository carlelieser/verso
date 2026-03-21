import React, { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { StyleSheet } from 'react-native';
import {
  EnrichedTextInput,
  type EnrichedTextInputInstance,
} from 'react-native-enriched';
import type { OnChangeHtmlEvent, OnChangeTextEvent } from 'react-native-enriched';
import type { NativeSyntheticEvent } from 'react-native';

import { COLORS } from '@/constants/theme';

export interface EditorRef {
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleHeading: (level: number) => void;
  toggleBulletList: () => void;
  toggleOrderedList: () => void;
  toggleBlockquote: () => void;
  setImage: (uri: string) => void;
  getHtml: () => Promise<string>;
  focus: () => void;
}

interface EditorProps {
  readonly initialContent?: string;
  readonly onChangeHtml?: (html: string) => void;
  readonly onChangeText?: (text: string) => void;
  readonly readOnly?: boolean;
}

export const Editor = forwardRef<EditorRef, EditorProps>(function Editor(
  { initialContent, onChangeHtml, onChangeText, readOnly = false },
  ref,
) {
  const inputRef = useRef<EnrichedTextInputInstance>(null);

  const handleChangeHtml = useCallback(
    (e: NativeSyntheticEvent<OnChangeHtmlEvent>) => {
      onChangeHtml?.(e.nativeEvent.value);
    },
    [onChangeHtml],
  );

  const handleChangeText = useCallback(
    (e: NativeSyntheticEvent<OnChangeTextEvent>) => {
      onChangeText?.(e.nativeEvent.value);
    },
    [onChangeText],
  );

  useImperativeHandle(ref, () => ({
    toggleBold: () => inputRef.current?.toggleBold(),
    toggleItalic: () => inputRef.current?.toggleItalic(),
    toggleHeading: (level: number) => {
      if (level === 1) inputRef.current?.toggleH1();
      else if (level === 2) inputRef.current?.toggleH2();
      else inputRef.current?.toggleH3();
    },
    toggleBulletList: () => inputRef.current?.toggleUnorderedList(),
    toggleOrderedList: () => inputRef.current?.toggleOrderedList(),
    toggleBlockquote: () => inputRef.current?.toggleBlockQuote(),
    setImage: (uri: string) => inputRef.current?.setImage(uri, 300, 200),
    getHtml: () => inputRef.current?.getHTML() ?? Promise.resolve(''),
    focus: () => inputRef.current?.focus(),
  }));

  return (
    <EnrichedTextInput
      ref={inputRef}
      style={styles.editor}
      defaultValue={initialContent}
      editable={!readOnly}
      autoFocus={!readOnly}
      placeholder="Start writing..."
      placeholderTextColor={COLORS.text.tertiary}
      cursorColor={COLORS.accent}
      onChangeHtml={handleChangeHtml}
      onChangeText={handleChangeText}
      htmlStyle={{
        h1: { fontSize: 28 },
        h2: { fontSize: 22 },
        h3: { fontSize: 18 },
        blockquote: {
          color: COLORS.text.secondary,
          borderColor: COLORS.accent,
          borderWidth: 3,
        },
      }}
    />
  );
});

const styles = StyleSheet.create({
  editor: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
});
