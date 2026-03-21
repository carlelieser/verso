import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DictationButton } from '@/components/editor/dictation-button';
import { Editor, type EditorRef } from '@/components/editor/editor';
import { Toolbar } from '@/components/editor/toolbar';
import { LoadingState } from '@/components/common/loading-state';
import { COLORS, SPACING } from '@/constants/theme';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useDatabaseContext } from '@/providers/database-provider';
import { createEntryService } from '@/services/entry-service';
import type { Entry } from '@/types/entry';
import { formatDate } from '@/utils/date';

export default function EntryEditorScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { db } = useDatabaseContext();
  const entryService = useMemo(() => createEntryService(db), [db]);

  const editorRef = useRef<EditorRef>(null);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { isSaving, save, flush } = useAutoSave(id ?? null);

  useEffect(() => {
    async function load(): Promise<void> {
      if (!id) return;
      const result = await entryService.getById(id);
      if (result) setEntry(result);
      setIsLoading(false);
    }
    load();
  }, [id, entryService]);

  const lastTextRef = useRef('');

  const handleChangeHtml = useCallback(
    (html: string) => {
      save(html, lastTextRef.current);
    },
    [save],
  );

  const handleChangeText = useCallback(
    (text: string) => {
      lastTextRef.current = text;
    },
    [],
  );

  const handleClose = useCallback(async () => {
    await flush();
    router.back();
  }, [flush]);

  const handleTranscribe = useCallback(
    (text: string) => {
      editorRef.current?.getHtml().then((currentHtml) => {
        const newHtml = currentHtml + text;
        save(newHtml, lastTextRef.current + text);
      });
    },
    [save],
  );

  if (isLoading) return <LoadingState />;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable onPress={handleClose}>
          <Text style={styles.closeButton}>✕</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          {isSaving ? (
            <Text style={styles.savingText}>Saving...</Text>
          ) : (
            <Text style={styles.savedText}>Saved</Text>
          )}
        </View>
        <Pressable onPress={() => router.push({ pathname: '/entry/emotions', params: { entryId: id } })}>
          <Text style={styles.moodButton}>Add Mood</Text>
        </Pressable>
      </View>

      {entry ? (
        <Text style={styles.dateLabel}>{formatDate(entry.createdAt)}</Text>
      ) : null}

      <View style={styles.editorContainer}>
        <Editor
          ref={editorRef}
          initialContent={entry?.contentHtml ?? ''}
          onChangeHtml={handleChangeHtml}
          onChangeText={handleChangeText}
        />
      </View>

      <View style={[styles.toolbarContainer, { paddingBottom: insets.bottom + SPACING.sm }]}>
        <Toolbar editorRef={editorRef} />
        <DictationButton onTranscribe={handleTranscribe} />
      </View>
    </KeyboardAvoidingView>
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
  closeButton: {
    fontSize: 20,
    color: COLORS.text.secondary,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  savingText: {
    fontSize: 13,
    color: COLORS.text.tertiary,
  },
  savedText: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  moodButton: {
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: '500',
  },
  dateLabel: {
    fontSize: 13,
    color: COLORS.text.secondary,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  editorContainer: {
    flex: 1,
  },
  toolbarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    gap: SPACING.md,
    backgroundColor: COLORS.background,
  },
});
