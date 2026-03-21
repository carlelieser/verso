import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/common/empty-state';
import { LoadingState } from '@/components/common/loading-state';
import { JournalCard } from '@/components/journals/journal-card';
import { CreateJournalSheet } from '@/components/journals/create-journal-sheet';
import { COLORS, RADII, SPACING } from '@/constants/theme';
import { useJournals } from '@/hooks/use-journals';
import type { Journal } from '@/types/journal';

export default function HomeScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { journals, isLoading, createJournal, renameJournal, reorderJournals, deleteJournal } =
    useJournals();
  const [isCreateSheetVisible, setIsCreateSheetVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Rename modal state
  const [renameTarget, setRenameTarget] = useState<Journal | null>(null);
  const [renameText, setRenameText] = useState('');

  const today = new Date();
  const greeting =
    today.getHours() < 12
      ? 'Good morning'
      : today.getHours() < 18
        ? 'Good afternoon'
        : 'Good evening';
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const handleJournalPress = useCallback(
    (journal: { id: string }) => {
      if (!isEditMode) {
        router.push(`/journal/${journal.id}`);
      }
    },
    [isEditMode],
  );

  const handleCreate = useCallback(
    async (name: string) => {
      await createJournal(name);
      setIsCreateSheetVisible(false);
    },
    [createJournal],
  );

  const handleLongPress = useCallback((journal: Journal) => {
    Alert.alert(journal.name, 'Choose an action', [
      {
        text: 'Rename',
        onPress: () => {
          setRenameTarget(journal);
          setRenameText(journal.name);
        },
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            'Delete Journal',
            `Are you sure you want to delete "${journal.name}"? This cannot be undone.`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                  deleteJournal(journal.id);
                },
              },
            ],
          );
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [deleteJournal]);

  const handleRenameSubmit = useCallback(async () => {
    if (!renameTarget) return;
    const trimmed = renameText.trim();
    if (trimmed.length === 0) return;

    await renameJournal(renameTarget.id, trimmed);
    setRenameTarget(null);
    setRenameText('');
  }, [renameTarget, renameText, renameJournal]);

  const handleRenameCancel = useCallback(() => {
    setRenameTarget(null);
    setRenameText('');
  }, []);

  const handleMoveUp = useCallback(
    async (index: number) => {
      if (index <= 0) return;
      const newOrder = [...journals.map((j) => j.id)];
      const targetId = newOrder[index];
      const swapId = newOrder[index - 1];
      if (!targetId || !swapId) return;
      newOrder[index] = swapId;
      newOrder[index - 1] = targetId;
      await reorderJournals(newOrder);
    },
    [journals, reorderJournals],
  );

  const handleMoveDown = useCallback(
    async (index: number) => {
      if (index >= journals.length - 1) return;
      const newOrder = [...journals.map((j) => j.id)];
      const targetId = newOrder[index];
      const swapId = newOrder[index + 1];
      if (!targetId || !swapId) return;
      newOrder[index] = swapId;
      newOrder[index + 1] = targetId;
      await reorderJournals(newOrder);
    },
    [journals, reorderJournals],
  );

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.date}>{dateString}</Text>
        </View>
        <View style={styles.headerActions}>
          {journals.length > 0 ? (
            <Pressable
              style={styles.editButton}
              onPress={() => setIsEditMode((prev) => !prev)}
            >
              <Text style={styles.editButtonText}>{isEditMode ? 'Done' : 'Edit'}</Text>
            </Pressable>
          ) : null}
          <Pressable
            style={styles.searchButton}
            onPress={() => router.push('/search')}
            accessibilityRole="button"
            accessibilityLabel="Search entries"
          >
            <Text style={styles.searchIcon}>🔍</Text>
          </Pressable>
        </View>
      </View>

      {journals.length === 0 ? (
        <EmptyState
          icon="📓"
          title="Start Your Journey"
          description="Create your first journal to begin capturing your thoughts."
          ctaLabel="New Journal"
          onCtaPress={() => setIsCreateSheetVisible(true)}
        />
      ) : (
        <>
          <Text style={styles.sectionLabel}>YOUR JOURNALS</Text>
          <FlatList
            data={journals}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <View style={styles.cardRow}>
                <View style={styles.cardContent}>
                  <JournalCard
                    journal={item}
                    onPress={() => handleJournalPress(item)}
                    onLongPress={() => handleLongPress(item)}
                  />
                </View>
                {isEditMode ? (
                  <View style={styles.reorderButtons}>
                    <Pressable
                      style={[styles.arrowButton, index === 0 && styles.arrowButtonDisabled]}
                      onPress={() => handleMoveUp(index)}
                      disabled={index === 0}
                    >
                      <Text
                        style={[
                          styles.arrowText,
                          index === 0 && styles.arrowTextDisabled,
                        ]}
                      >
                        ▲
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.arrowButton,
                        index === journals.length - 1 && styles.arrowButtonDisabled,
                      ]}
                      onPress={() => handleMoveDown(index)}
                      disabled={index === journals.length - 1}
                    >
                      <Text
                        style={[
                          styles.arrowText,
                          index === journals.length - 1 && styles.arrowTextDisabled,
                        ]}
                      >
                        ▼
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            )}
            contentContainerStyle={styles.list}
          />
        </>
      )}

      <Pressable
        style={styles.fab}
        onPress={() => setIsCreateSheetVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Create new journal"
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <CreateJournalSheet
        isVisible={isCreateSheetVisible}
        onDismiss={() => setIsCreateSheetVisible(false)}
        onCreate={handleCreate}
      />

      {/* Rename Modal */}
      <Modal
        visible={renameTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={handleRenameCancel}
      >
        <Pressable style={styles.modalOverlay} onPress={handleRenameCancel}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Text style={styles.modalTitle}>Rename Journal</Text>
            <TextInput
              style={styles.modalInput}
              value={renameText}
              onChangeText={setRenameText}
              placeholder="Journal name"
              placeholderTextColor={COLORS.text.tertiary}
              autoFocus
              selectTextOnFocus
              onSubmitEditing={handleRenameSubmit}
              returnKeyType="done"
            />
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalCancelButton} onPress={handleRenameCancel}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSaveButton} onPress={handleRenameSubmit}>
                <Text style={styles.modalSaveText}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  editButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.full,
    backgroundColor: COLORS.card,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.accent,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: RADII.full,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIcon: {
    fontSize: 18,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  date: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.tertiary,
    letterSpacing: 1,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  list: {
    paddingHorizontal: SPACING.lg,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  reorderButtons: {
    marginLeft: SPACING.sm,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: RADII.md,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowButtonDisabled: {
    opacity: 0.3,
  },
  arrowText: {
    fontSize: 14,
    color: COLORS.text.primary,
  },
  arrowTextDisabled: {
    color: COLORS.text.tertiary,
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: RADII.full,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 28,
    color: COLORS.background,
    fontWeight: '300',
    marginTop: -2,
  },
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
  modalCancelButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.md,
  },
  modalCancelText: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  modalSaveButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.md,
    backgroundColor: COLORS.accent,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.background,
  },
});
