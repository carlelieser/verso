import { router, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AttachmentList } from '@/components/editor/attachment-list';
import { DictationButton } from '@/components/editor/dictation-button';
import { Editor, type EditorRef } from '@/components/editor/editor';
import { Toolbar } from '@/components/editor/toolbar';
import { LoadingState } from '@/components/common/loading-state';
import { COLORS, RADII, SPACING } from '@/constants/theme';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useDatabaseContext } from '@/providers/database-provider';
import { createAttachmentService } from '@/services/attachment-service';
import { createEntryService } from '@/services/entry-service';
import { createLocationService } from '@/services/location-service';
import type { Attachment } from '@/types/attachment';
import type { Location } from '@/types/attachment';
import type { Entry } from '@/types/entry';
import { formatDate } from '@/utils/date';
import { pickImage } from '@/utils/image';

export default function EntryEditorScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { db } = useDatabaseContext();
  const entryService = useMemo(() => createEntryService(db), [db]);
  const locationService = useMemo(() => createLocationService(db), [db]);
  const attachmentService = useMemo(() => createAttachmentService(db), [db]);

  const editorRef = useRef<EditorRef>(null);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Location state
  const [location, setLocation] = useState<Location | undefined>(undefined);
  const [isLocationSheetVisible, setIsLocationSheetVisible] = useState(false);
  const [manualLocationText, setManualLocationText] = useState('');

  // Attachment state
  const [attachments, setAttachments] = useState<readonly Attachment[]>([]);
  const [isAttachmentMenuVisible, setIsAttachmentMenuVisible] = useState(false);
  const [isLinkModalVisible, setIsLinkModalVisible] = useState(false);
  const [linkText, setLinkText] = useState('');

  const { isSaving, save, flush } = useAutoSave(id ?? null);

  useEffect(() => {
    async function load(): Promise<void> {
      if (!id) return;
      const result = await entryService.getById(id);
      if (result) setEntry(result);

      const loc = await locationService.getByEntry(id);
      setLocation(loc);

      const att = await attachmentService.getByEntry(id);
      setAttachments(att);

      setIsLoading(false);
    }
    load();
  }, [id, entryService, locationService, attachmentService]);

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

  // --- Location handlers ---

  const handleUseCurrentLocation = useCallback(async () => {
    if (!id) return;
    try {
      const loc = await locationService.setFromDevice(id);
      setLocation(loc);
      setIsLocationSheetVisible(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to get location';
      Alert.alert('Location Error', message);
    }
  }, [id, locationService]);

  const handleManualLocationSubmit = useCallback(async () => {
    if (!id) return;
    const trimmed = manualLocationText.trim();
    if (trimmed.length === 0) return;

    const loc = await locationService.setManual(id, trimmed);
    setLocation(loc);
    setManualLocationText('');
    setIsLocationSheetVisible(false);
  }, [id, manualLocationText, locationService]);

  const handleRemoveLocation = useCallback(async () => {
    if (!id) return;
    await locationService.remove(id);
    setLocation(undefined);
  }, [id, locationService]);

  // --- Attachment handlers ---

  const handleAddPhoto = useCallback(async () => {
    if (!id) return;
    setIsAttachmentMenuVisible(false);
    const uri = await pickImage();
    if (!uri) return;
    const attachment = await attachmentService.addPhoto(id, uri);
    setAttachments((prev) => [...prev, attachment]);
  }, [id, attachmentService]);

  const handleAddVoiceMemo = useCallback(() => {
    setIsAttachmentMenuVisible(false);
    Alert.alert('Voice Memo', 'Voice memo recording will be available in a future update.');
  }, []);

  const handleAddFile = useCallback(async () => {
    if (!id) return;
    setIsAttachmentMenuVisible(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      const attachment = await attachmentService.addFile(id, asset.uri, asset.name);
      setAttachments((prev) => [...prev, attachment]);
    } catch {
      // User cancelled or picker failed silently
    }
  }, [id, attachmentService]);

  const handleAddLink = useCallback(async () => {
    setIsAttachmentMenuVisible(false);
    setLinkText('');
    setIsLinkModalVisible(true);
  }, []);

  const handleLinkSubmit = useCallback(async () => {
    if (!id) return;
    const trimmed = linkText.trim();
    if (trimmed.length === 0) return;

    const attachment = await attachmentService.addLink(id, trimmed);
    setAttachments((prev) => [...prev, attachment]);
    setIsLinkModalVisible(false);
    setLinkText('');
  }, [id, linkText, attachmentService]);

  const handleRemoveAttachment = useCallback(
    async (attachmentId: string) => {
      await attachmentService.delete(attachmentId);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    },
    [attachmentService],
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
        <View style={styles.headerRight}>
          <Pressable onPress={() => setIsLocationSheetVisible(true)}>
            <Text style={styles.headerAction}>📍</Text>
          </Pressable>
          <Pressable onPress={() => router.push({ pathname: '/entry/emotions', params: { entryId: id } })}>
            <Text style={styles.moodButton}>Add Mood</Text>
          </Pressable>
        </View>
      </View>

      {entry ? (
        <View style={styles.metaRow}>
          <Text style={styles.dateLabel}>{formatDate(entry.createdAt)}</Text>
          {location ? (
            <Pressable onPress={handleRemoveLocation} style={styles.locationBadge}>
              <Text style={styles.locationText} numberOfLines={1}>
                📍 {location.name}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View style={styles.editorContainer}>
        <Editor
          ref={editorRef}
          initialContent={entry?.contentHtml ?? ''}
          onChangeHtml={handleChangeHtml}
          onChangeText={handleChangeText}
        />
      </View>

      {attachments.length > 0 ? (
        <AttachmentList attachments={attachments} onRemove={handleRemoveAttachment} />
      ) : null}

      <View style={[styles.toolbarContainer, { paddingBottom: insets.bottom + SPACING.sm }]}>
        <Toolbar editorRef={editorRef} />
        <Pressable
          style={styles.attachButton}
          onPress={() => setIsAttachmentMenuVisible(true)}
        >
          <Text style={styles.attachButtonText}>📎</Text>
        </Pressable>
        <DictationButton onTranscribe={handleTranscribe} />
      </View>

      {/* Location Bottom Sheet */}
      <Modal
        visible={isLocationSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsLocationSheetVisible(false)}
      >
        <Pressable
          style={styles.sheetOverlay}
          onPress={() => setIsLocationSheetVisible(false)}
        >
          <Pressable style={styles.sheetContent} onPress={() => {}}>
            <Text style={styles.sheetTitle}>Add Location</Text>

            <Pressable style={styles.sheetOption} onPress={handleUseCurrentLocation}>
              <Text style={styles.sheetOptionText}>📍 Use Current Location</Text>
            </Pressable>

            <View style={styles.sheetDivider} />

            <Text style={styles.sheetLabel}>Or enter manually</Text>
            <View style={styles.sheetInputRow}>
              <TextInput
                style={styles.sheetInput}
                value={manualLocationText}
                onChangeText={setManualLocationText}
                placeholder="e.g. Coffee shop, Paris"
                placeholderTextColor={COLORS.text.tertiary}
                returnKeyType="done"
                onSubmitEditing={handleManualLocationSubmit}
              />
              <Pressable style={styles.sheetSubmitButton} onPress={handleManualLocationSubmit}>
                <Text style={styles.sheetSubmitText}>Add</Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.sheetCancelButton}
              onPress={() => setIsLocationSheetVisible(false)}
            >
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Attachment Menu */}
      <Modal
        visible={isAttachmentMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAttachmentMenuVisible(false)}
      >
        <Pressable
          style={styles.sheetOverlay}
          onPress={() => setIsAttachmentMenuVisible(false)}
        >
          <Pressable style={styles.sheetContent} onPress={() => {}}>
            <Text style={styles.sheetTitle}>Add Attachment</Text>

            <Pressable style={styles.sheetOption} onPress={handleAddPhoto}>
              <Text style={styles.sheetOptionText}>🖼 Photo</Text>
            </Pressable>
            <Pressable style={styles.sheetOption} onPress={handleAddVoiceMemo}>
              <Text style={styles.sheetOptionText}>🎙 Voice Memo</Text>
            </Pressable>
            <Pressable style={styles.sheetOption} onPress={handleAddFile}>
              <Text style={styles.sheetOptionText}>📄 File</Text>
            </Pressable>
            <Pressable style={styles.sheetOption} onPress={handleAddLink}>
              <Text style={styles.sheetOptionText}>🔗 Link</Text>
            </Pressable>

            <Pressable
              style={styles.sheetCancelButton}
              onPress={() => setIsAttachmentMenuVisible(false)}
            >
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Link Input Modal */}
      <Modal
        visible={isLinkModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsLinkModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsLinkModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Text style={styles.modalTitle}>Add Link</Text>
            <TextInput
              style={styles.modalInput}
              value={linkText}
              onChangeText={setLinkText}
              placeholder="https://..."
              placeholderTextColor={COLORS.text.tertiary}
              autoFocus
              autoCapitalize="none"
              keyboardType="url"
              returnKeyType="done"
              onSubmitEditing={handleLinkSubmit}
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setIsLinkModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSaveBtn} onPress={handleLinkSubmit}>
                <Text style={styles.modalSaveBtnText}>Add</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  headerAction: {
    fontSize: 18,
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
  metaRow: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  dateLabel: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.card,
    borderRadius: RADII.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginTop: SPACING.xs,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    maxWidth: 200,
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
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: RADII.full,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachButtonText: {
    fontSize: 18,
  },
  // Bottom sheet styles
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: RADII.xl,
    borderTopRightRadius: RADII.xl,
    padding: SPACING['2xl'],
    paddingBottom: SPACING['4xl'],
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.lg,
  },
  sheetOption: {
    paddingVertical: SPACING.md,
  },
  sheetOptionText: {
    fontSize: 16,
    color: COLORS.text.primary,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  sheetLabel: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  sheetInputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  sheetInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  sheetSubmitButton: {
    backgroundColor: COLORS.accent,
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
  },
  sheetSubmitText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.background,
  },
  sheetCancelButton: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  sheetCancelText: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  // Modal styles (for link input)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING['2xl'],
  },
  modalContent: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: RADII.xl,
    padding: SPACING['2xl'],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.lg,
  },
  modalInput: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: 16,
    color: COLORS.text.primary,
    marginBottom: SPACING.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.md,
  },
  modalCancelBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.md,
  },
  modalCancelBtnText: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  modalSaveBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.md,
    backgroundColor: COLORS.accent,
  },
  modalSaveBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.background,
  },
});
