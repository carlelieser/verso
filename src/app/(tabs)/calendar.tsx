import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { DateData } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MoodCalendar } from '@/components/calendar/mood-calendar';
import { COLORS, RADII, SPACING } from '@/constants/theme';
import { useDatabaseContext } from '@/providers/database-provider';
import type { DayMood } from '@/types/emotion';
import type { Entry } from '@/types/entry';
import { formatTime, getDateString } from '@/utils/date';

/** Raw SQLite client type extracted from drizzle for direct queries. */
type RawSqliteClient = {
  getAllSync: (sql: string, params: unknown[]) => Array<Record<string, unknown>>;
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

function formatMonthYear(dateString: string): string {
  const [yearStr, monthStr] = dateString.split('-');
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  const monthName = MONTH_NAMES[monthIndex] ?? 'Unknown';
  return `${monthName} ${String(year)}`;
}

function shiftMonth(dateString: string, direction: -1 | 1): string {
  const [yearStr, monthStr] = dateString.split('-');
  let year = Number(yearStr);
  let month = Number(monthStr) + direction;

  if (month < 1) {
    month = 12;
    year -= 1;
  } else if (month > 12) {
    month = 1;
    year += 1;
  }

  return `${String(year)}-${String(month).padStart(2, '0')}-01`;
}

/**
 * Builds DayMood data for a given month by checking which dates have entries.
 * This is a placeholder until EmotionService provides real mood data.
 */
function buildDayMoodsFromEntries(entriesForMonth: readonly Entry[]): readonly DayMood[] {
  const dateMap = new Map<string, boolean>();
  for (const entry of entriesForMonth) {
    const dateStr = getDateString(entry.createdAt);
    dateMap.set(dateStr, true);
  }

  return Array.from(dateMap.entries()).map(([date]) => ({
    date,
    dominantEmotion: undefined,
    intensity: undefined,
    hasEntry: true,
  }));
}

interface EntryCardProps {
  readonly entry: Entry;
}

function EntryCard({ entry }: EntryCardProps): React.JSX.Element {
  const preview = entry.contentText.length > 120
    ? `${entry.contentText.slice(0, 120)}...`
    : entry.contentText;

  return (
    <View style={entryCardStyles.card}>
      <View style={entryCardStyles.header}>
        <Text style={entryCardStyles.time}>{formatTime(entry.createdAt)}</Text>
      </View>
      {preview.length > 0 ? (
        <Text style={entryCardStyles.preview} numberOfLines={3}>
          {preview}
        </Text>
      ) : (
        <Text style={entryCardStyles.emptyPreview}>Empty entry</Text>
      )}
    </View>
  );
}

const entryCardStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  time: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },
  preview: {
    fontSize: 14,
    color: COLORS.text.primary,
    lineHeight: 20,
  },
  emptyPreview: {
    fontSize: 14,
    color: COLORS.text.tertiary,
    fontStyle: 'italic',
  },
});

export default function CalendarScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { db } = useDatabaseContext();
  const todayString = useMemo(() => getDateString(Date.now()), []);
  const [currentMonth, setCurrentMonth] = useState(
    () => `${todayString.slice(0, 7)}-01`,
  );
  const [selectedDate, setSelectedDate] = useState(todayString);
  const [dayMoods, setDayMoods] = useState<readonly DayMood[]>([]);
  const [selectedEntries, setSelectedEntries] = useState<readonly Entry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);

  const selectedDateLabel = useMemo(() => {
    const date = new Date(`${selectedDate}T12:00:00`);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }, [selectedDate]);

  // Load month data whenever the visible month changes.
  // Without EmotionService, we load entries across all journals for the month
  // to determine which days have entries.
  useEffect(() => {
    const loadMonthData = async (): Promise<void> => {
      try {
        const [yearStr, monthStr] = currentMonth.split('-');
        const year = Number(yearStr);
        const month = Number(monthStr);
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59, 999);

        // Query entries across all journals for the month using raw SQL
        // since filterByDateRange requires a journalId.
        // This will be replaced by InsightsService.getMoodHeatmap once available.
        const rawDb = (db as unknown as { $client: RawSqliteClient }).$client;

        const rows = rawDb.getAllSync(
          `SELECT id, journal_id, content_html, content_text, created_at, updated_at
           FROM entry
           WHERE created_at >= ? AND created_at <= ?
           ORDER BY created_at DESC`,
          [start.getTime(), end.getTime()],
        );

        const monthEntries: readonly Entry[] = rows.map((row) => ({
          id: row['id'] as string,
          journalId: row['journal_id'] as string,
          contentHtml: row['content_html'] as string,
          contentText: row['content_text'] as string,
          createdAt: row['created_at'] as number,
          updatedAt: row['updated_at'] as number,
        }));

        setDayMoods(buildDayMoodsFromEntries(monthEntries));
      } catch {
        // Silently degrade -- calendar still works without mood dots
        setDayMoods([]);
      }
    };

    void loadMonthData();
  }, [currentMonth, db]);

  // Load entries for the selected date
  useEffect(() => {
    const loadSelectedDateEntries = async (): Promise<void> => {
      try {
        setIsLoadingEntries(true);
        const rawDb = (db as unknown as { $client: RawSqliteClient }).$client;

        const startOfDay = new Date(`${selectedDate}T00:00:00.000Z`);
        const endOfDay = new Date(`${selectedDate}T23:59:59.999Z`);

        const rows = rawDb.getAllSync(
          `SELECT id, journal_id, content_html, content_text, created_at, updated_at
           FROM entry
           WHERE created_at >= ? AND created_at <= ?
           ORDER BY created_at DESC`,
          [startOfDay.getTime(), endOfDay.getTime()],
        );

        setSelectedEntries(
          rows.map((row) => ({
            id: row['id'] as string,
            journalId: row['journal_id'] as string,
            contentHtml: row['content_html'] as string,
            contentText: row['content_text'] as string,
            createdAt: row['created_at'] as number,
            updatedAt: row['updated_at'] as number,
          })),
        );
      } catch {
        setSelectedEntries([]);
      } finally {
        setIsLoadingEntries(false);
      }
    };

    void loadSelectedDateEntries();
  }, [selectedDate, db]);

  const handleDayPress = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const handleMonthChange = useCallback((dateData: DateData) => {
    setCurrentMonth(dateData.dateString);
  }, []);

  const handlePreviousMonth = useCallback(() => {
    setCurrentMonth((prev) => shiftMonth(prev, -1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((prev) => shiftMonth(prev, 1));
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={handlePreviousMonth}
          style={styles.arrowButton}
          accessibilityLabel="Previous month"
          accessibilityRole="button"
        >
          <Text style={styles.arrowText}>{'<'}</Text>
        </Pressable>
        <Text style={styles.monthTitle}>{formatMonthYear(currentMonth)}</Text>
        <Pressable
          onPress={handleNextMonth}
          style={styles.arrowButton}
          accessibilityLabel="Next month"
          accessibilityRole="button"
        >
          <Text style={styles.arrowText}>{'>'}</Text>
        </Pressable>
      </View>

      <MoodCalendar
        dayMoods={dayMoods}
        onDayPress={handleDayPress}
        selectedDate={selectedDate}
        currentMonth={currentMonth}
        onMonthChange={handleMonthChange}
      />

      <View style={styles.selectedDaySection}>
        <Text style={styles.selectedDayLabel}>{selectedDateLabel}</Text>
        {selectedEntries.length === 0 && !isLoadingEntries ? (
          <View style={styles.noEntriesContainer}>
            <Text style={styles.noEntriesText}>No entries for this day</Text>
          </View>
        ) : (
          <FlatList
            data={selectedEntries}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <EntryCard entry={item} />}
            contentContainerStyle={styles.entryList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
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
  arrowButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.full,
  },
  arrowText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.accent,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  selectedDaySection: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  selectedDayLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  noEntriesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noEntriesText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  entryList: {
    paddingBottom: SPACING['3xl'],
  },
});
