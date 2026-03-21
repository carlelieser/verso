import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, RADII, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { useDatabaseContext } from '@/providers/database-provider';
import { createEntryService } from '@/services/entry-service';
import type { EmotionCategory } from '@/types/common';
import type { Entry } from '@/types/entry';

const EMOTION_CATEGORIES: readonly EmotionCategory[] = [
  'happy',
  'sad',
  'anxious',
  'calm',
  'frustrated',
  'excited',
  'grateful',
  'angry',
  'hopeful',
  'tired',
] as const;

const EMOTION_LABELS: Record<EmotionCategory, string> = {
  happy: 'Happy',
  sad: 'Sad',
  anxious: 'Anxious',
  calm: 'Calm',
  frustrated: 'Frustrated',
  excited: 'Excited',
  grateful: 'Grateful',
  angry: 'Angry',
  hopeful: 'Hopeful',
  tired: 'Tired',
} as const;

function formatEntryDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength).trim() + '...';
}

export default function SearchScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { journalId } = useLocalSearchParams<{ journalId: string }>();
  const { db } = useDatabaseContext();
  const entryService = useMemo(() => createEntryService(db), [db]);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<readonly Entry[]>([]);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionCategory | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  const performSearch = useCallback(async () => {
    if (!journalId) return;

    setIsSearching(true);

    try {
      if (selectedEmotion) {
        const emotionResults = await entryService.filterByEmotion(journalId, selectedEmotion);
        if (query.trim().length > 0) {
          const searchResults = await entryService.search(journalId, query.trim());
          const searchIds = new Set(searchResults.map((e) => e.id));
          setResults(emotionResults.filter((e) => searchIds.has(e.id)));
        } else {
          setResults(emotionResults);
        }
      } else if (query.trim().length > 0) {
        const searchResults = await entryService.search(journalId, query.trim());
        setResults(searchResults);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [journalId, query, selectedEmotion, entryService]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [performSearch]);

  const handleEmotionPress = useCallback((emotion: EmotionCategory) => {
    setSelectedEmotion((prev) => (prev === emotion ? null : emotion));
  }, []);

  const handleEntryPress = useCallback((entry: Entry) => {
    router.push(`/entry/${entry.id}`);
  }, []);

  const hasActiveFilters = query.trim().length > 0 || selectedEmotion !== null;

  const renderEntryCard = useCallback(
    ({ item }: { item: Entry }) => (
      <Pressable
        style={({ pressed }) => [styles.entryCard, pressed && styles.entryCardPressed]}
        onPress={() => handleEntryPress(item)}
      >
        <Text style={styles.entryDate}>{formatEntryDate(item.createdAt)}</Text>
        <Text style={styles.entryPreview} numberOfLines={3}>
          {truncateText(item.contentText, 200)}
        </Text>
      </Pressable>
    ),
    [handleEntryPress],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backButton}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Search</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.searchBarContainer}>
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search entries..."
          placeholderTextColor={COLORS.text.tertiary}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {EMOTION_CATEGORIES.map((emotion) => {
            const isSelected = selectedEmotion === emotion;
            return (
              <Pressable
                key={emotion}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => handleEmotionPress(emotion)}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {EMOTION_LABELS[emotion]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {hasActiveFilters ? (
        <Text style={styles.resultsCount}>
          {isSearching ? 'Searching...' : `${results.length} ${results.length === 1 ? 'entry' : 'entries'} found`}
        </Text>
      ) : null}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderEntryCard}
        contentContainerStyle={styles.resultsList}
        ListEmptyComponent={
          hasActiveFilters && !isSearching ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No entries match your search</Text>
            </View>
          ) : !hasActiveFilters ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Search by keyword or filter by emotion</Text>
            </View>
          ) : null
        }
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.accent,
    minWidth: 48,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
  },
  headerSpacer: {
    minWidth: 48,
  },
  searchBarContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  searchInput: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.full,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filtersContainer: {
    paddingBottom: SPACING.md,
  },
  filtersContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  filterChip: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  filterChipText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
  },
  filterChipTextActive: {
    color: COLORS.background,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  resultsCount: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.text.tertiary,
    letterSpacing: 0.5,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  resultsList: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING['4xl'],
  },
  entryCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  entryCardPressed: {
    opacity: 0.8,
  },
  entryDate: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.tertiary,
    marginBottom: SPACING.sm,
  },
  entryPreview: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.primary,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING['4xl'],
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.tertiary,
  },
});
