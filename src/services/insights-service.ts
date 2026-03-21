import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

import type { EmotionCategory, TimeRange } from '@/types/common';
import type { DayMood, EmotionRanking, MoodDataPoint, StreakData } from '@/types/emotion';

interface RawClient {
  readonly getAllSync: (sql: string, params: unknown[]) => Array<Record<string, unknown>>;
}

interface MoodHeatmapParams {
  readonly month: number;
  readonly year: number;
}

interface MoodTrendsChartParams {
  readonly range: TimeRange;
}

interface TopEmotionsParams {
  readonly range: TimeRange;
  readonly limit?: number;
}

const ENCOURAGING_MESSAGES: Record<string, string> = {
  zero: 'Start your journaling journey today!',
  short: 'Great start! Keep the momentum going.',
  medium: 'You are building a strong habit. Keep it up!',
  long: 'Incredible consistency! Journaling is part of your routine.',
  epic: 'You are a journaling champion! What an amazing streak.',
};

function getEncouragingMessage(streak: number): string {
  if (streak === 0) return ENCOURAGING_MESSAGES['zero'] ?? '';
  if (streak < 7) return ENCOURAGING_MESSAGES['short'] ?? '';
  if (streak < 30) return ENCOURAGING_MESSAGES['medium'] ?? '';
  if (streak < 100) return ENCOURAGING_MESSAGES['long'] ?? '';
  return ENCOURAGING_MESSAGES['epic'] ?? '';
}

function getRawClient(db: ExpoSQLiteDatabase): RawClient {
  return (db as unknown as { $client: RawClient }).$client;
}

function getRangeStartMs(range: TimeRange): number {
  const now = new Date();
  switch (range) {
    case 'week':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).getTime();
    case 'month':
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).getTime();
    case '3months':
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()).getTime();
    case 'year':
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).getTime();
  }
}

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

function padDay(day: number): string {
  return day < 10 ? `0${day}` : `${day}`;
}

function padMonth(month: number): string {
  return month < 10 ? `0${month}` : `${month}`;
}

export function createInsightsService(db: ExpoSQLiteDatabase): {
  getStreak: () => StreakData;
  getMoodHeatmap: (params: MoodHeatmapParams) => readonly DayMood[];
  getMoodTrendsChart: (params: MoodTrendsChartParams) => readonly MoodDataPoint[];
  getTopEmotions: (params: TopEmotionsParams) => readonly EmotionRanking[];
} {
  const rawDb = getRawClient(db);

  return {
    getStreak(): StreakData {
      const totalEntriesRows = rawDb.getAllSync(
        `SELECT COUNT(DISTINCT date(created_at / 1000, 'unixepoch', 'localtime')) as total
         FROM entry`,
        [],
      );
      const totalEntries = (totalEntriesRows[0]?.['total'] as number | undefined) ?? 0;

      // Recursive CTE to compute current streak of consecutive journaling days
      const currentStreakRows = rawDb.getAllSync(
        `WITH RECURSIVE
         journal_days AS (
           SELECT DISTINCT date(created_at / 1000, 'unixepoch', 'localtime') AS day
           FROM entry
         ),
         streak AS (
           SELECT date('now', 'localtime') AS day, 0 AS depth
           UNION ALL
           SELECT date(streak.day, '-1 day'), streak.depth + 1
           FROM streak
           WHERE EXISTS (
             SELECT 1 FROM journal_days WHERE journal_days.day = date(streak.day, '-1 day')
           )
         )
         SELECT MAX(depth) AS current_streak FROM streak`,
        [],
      );
      const rawCurrentStreak =
        (currentStreakRows[0]?.['current_streak'] as number | undefined) ?? 0;

      // Check if today has an entry; if not, check if yesterday starts the streak
      const hasTodayRows = rawDb.getAllSync(
        `SELECT COUNT(*) AS cnt FROM entry
         WHERE date(created_at / 1000, 'unixepoch', 'localtime') = date('now', 'localtime')`,
        [],
      );
      const hasToday = ((hasTodayRows[0]?.['cnt'] as number | undefined) ?? 0) > 0;

      // The CTE starts from today and walks backward. If today has no entry,
      // the streak includes today in "depth" but the first real match is yesterday.
      // We only count the streak if today or yesterday is included.
      let currentStreak = rawCurrentStreak;
      if (!hasToday && rawCurrentStreak > 0) {
        // The CTE walked from today but today has no entry, so depth 0 (today) doesn't count.
        // But depth 1+ means yesterday onward had entries. The streak is depth - 0
        // Actually the CTE only recurses when the *previous* day exists, so if today
        // has no entry but yesterday does, depth goes to 1+ via the recursion.
        // currentStreak = rawCurrentStreak is correct because the CTE base case is today,
        // and it only recurses if day-1 exists. So depth = number of consecutive days before today.
        // But we should not count it as a "current streak" unless yesterday had an entry.
        const hasYesterdayRows = rawDb.getAllSync(
          `SELECT COUNT(*) AS cnt FROM entry
           WHERE date(created_at / 1000, 'unixepoch', 'localtime') = date('now', '-1 day', 'localtime')`,
          [],
        );
        const hasYesterday = ((hasYesterdayRows[0]?.['cnt'] as number | undefined) ?? 0) > 0;
        if (!hasYesterday) {
          currentStreak = 0;
        }
      } else if (hasToday) {
        // Today counts as part of the streak, so add 1 to the backward walk
        currentStreak = rawCurrentStreak + 1;
      }

      // Longest streak via gaps between consecutive journal days
      const longestStreakRows = rawDb.getAllSync(
        `WITH journal_days AS (
           SELECT DISTINCT date(created_at / 1000, 'unixepoch', 'localtime') AS day
           FROM entry
         ),
         numbered AS (
           SELECT day, ROW_NUMBER() OVER (ORDER BY day) AS rn
           FROM journal_days
         ),
         groups AS (
           SELECT day, date(day, '-' || rn || ' days') AS grp
           FROM numbered
         )
         SELECT MAX(cnt) AS longest FROM (
           SELECT grp, COUNT(*) AS cnt FROM groups GROUP BY grp
         )`,
        [],
      );
      const longestStreak = (longestStreakRows[0]?.['longest'] as number | undefined) ?? 0;

      return {
        currentStreak,
        longestStreak: Math.max(longestStreak, currentStreak),
        totalEntries,
        encouragingMessage: getEncouragingMessage(currentStreak),
      };
    },

    getMoodHeatmap({ month, year }): readonly DayMood[] {
      const daysInMonth = getDaysInMonth(month, year);
      const monthStr = padMonth(month);

      // Get the dominant emotion for each day in the given month
      const rows = rawDb.getAllSync(
        `WITH daily_emotions AS (
           SELECT
             date(e.created_at / 1000, 'unixepoch', 'localtime') AS day,
             er.category,
             AVG(er.intensity) AS avg_intensity,
             COUNT(*) AS cnt
           FROM entry e
           JOIN emotion_record er ON er.entry_id = e.id
           WHERE date(e.created_at / 1000, 'unixepoch', 'localtime')
             BETWEEN ? AND ?
           GROUP BY day, er.category
         ),
         ranked AS (
           SELECT
             day,
             category,
             avg_intensity,
             ROW_NUMBER() OVER (PARTITION BY day ORDER BY cnt DESC, avg_intensity DESC) AS rn
           FROM daily_emotions
         )
         SELECT day, category, avg_intensity
         FROM ranked
         WHERE rn = 1`,
        [`${year}-${monthStr}-01`, `${year}-${monthStr}-${padDay(daysInMonth)}`],
      );

      // Also get which days have entries (even without emotions)
      const entryDayRows = rawDb.getAllSync(
        `SELECT DISTINCT date(created_at / 1000, 'unixepoch', 'localtime') AS day
         FROM entry
         WHERE date(created_at / 1000, 'unixepoch', 'localtime')
           BETWEEN ? AND ?`,
        [`${year}-${monthStr}-01`, `${year}-${monthStr}-${padDay(daysInMonth)}`],
      );

      const moodMap = new Map<string, { category: EmotionCategory; intensity: number }>();
      for (const row of rows) {
        const day = row['day'] as string;
        moodMap.set(day, {
          category: row['category'] as EmotionCategory,
          intensity: row['avg_intensity'] as number,
        });
      }

      const entryDays = new Set(entryDayRows.map((r) => r['day'] as string));

      const result: DayMood[] = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${monthStr}-${padDay(d)}`;
        const mood = moodMap.get(dateStr);
        const hasEntry = entryDays.has(dateStr);

        result.push({
          date: dateStr,
          dominantEmotion: mood?.category,
          intensity: mood?.intensity,
          hasEntry,
        });
      }

      return result;
    },

    getMoodTrendsChart({ range }): readonly MoodDataPoint[] {
      const startMs = getRangeStartMs(range);

      const rows = rawDb.getAllSync(
        `SELECT
           date(e.created_at / 1000, 'unixepoch', 'localtime') AS day,
           er.category,
           AVG(er.intensity) AS avg_intensity
         FROM entry e
         JOIN emotion_record er ON er.entry_id = e.id
         WHERE e.created_at >= ?
         GROUP BY day, er.category
         ORDER BY day ASC, avg_intensity DESC`,
        [startMs],
      );

      return rows.map((row) => ({
        date: row['day'] as string,
        category: row['category'] as EmotionCategory,
        intensity: row['avg_intensity'] as number,
      }));
    },

    getTopEmotions({ range, limit = 5 }): readonly EmotionRanking[] {
      const startMs = getRangeStartMs(range);

      const rows = rawDb.getAllSync(
        `SELECT
           er.category,
           COUNT(*) AS count,
           AVG(er.intensity) AS avg_intensity
         FROM emotion_record er
         JOIN entry e ON e.id = er.entry_id
         WHERE e.created_at >= ?
         GROUP BY er.category
         ORDER BY count DESC
         LIMIT ?`,
        [startMs, limit],
      );

      return rows.map((row, index) => ({
        category: row['category'] as EmotionCategory,
        count: row['count'] as number,
        avgIntensity: row['avg_intensity'] as number,
        rank: index + 1,
      }));
    },
  };
}
