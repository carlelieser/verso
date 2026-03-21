import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/common/empty-state';
import { LoadingState } from '@/components/common/loading-state';
import { JournalCard } from '@/components/journals/journal-card';
import { CreateJournalSheet } from '@/components/journals/create-journal-sheet';
import { COLORS, RADII, SPACING } from '@/constants/theme';
import { useJournals } from '@/hooks/use-journals';

export default function HomeScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { journals, isLoading, createJournal } = useJournals();
  const [isCreateSheetVisible, setIsCreateSheetVisible] = useState(false);

  const today = new Date();
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const handleJournalPress = useCallback((journal: { id: string }) => {
    router.push(`/journal/${journal.id}`);
  }, []);

  const handleCreate = useCallback(
    async (name: string) => {
      await createJournal(name);
      setIsCreateSheetVisible(false);
    },
    [createJournal],
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
        <Pressable
          style={styles.searchButton}
          onPress={() => router.push('/search')}
        >
          <Text style={styles.searchIcon}>🔍</Text>
        </Pressable>
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
            renderItem={({ item }) => (
              <JournalCard journal={item} onPress={() => handleJournalPress(item)} />
            )}
            contentContainerStyle={styles.list}
          />
        </>
      )}

      <Pressable
        style={styles.fab}
        onPress={() => setIsCreateSheetVisible(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <CreateJournalSheet
        isVisible={isCreateSheetVisible}
        onDismiss={() => setIsCreateSheetVisible(false)}
        onCreate={handleCreate}
      />
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
});
