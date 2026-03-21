import { and, desc, eq, gte, lte } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

import { emotionRecords, entries } from '@/db/schema';
import type { EmotionCategory } from '@/types/common';
import type { DayMood, EmotionInput, EmotionRecord } from '@/types/emotion';
import { generateId } from '@/utils/id';

interface EmotionService {
  readonly setEmotions: (entryId: string, emotions: readonly EmotionInput[]) => Promise<readonly EmotionRecord[]>;
  readonly getByEntry: (entryId: string) => Promise<readonly EmotionRecord[]>;
  readonly getDominantMoodForDay: (date: string) => Promise<DayMood>;
}

/**
 * Creates an EmotionService backed by Drizzle ORM.
 *
 * @param db - The Expo SQLite database instance
 * @returns An EmotionService for managing emotion records
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createEmotionService(db: ExpoSQLiteDatabase<any>): EmotionService {
  return {
    async setEmotions(entryId, emotions): Promise<readonly EmotionRecord[]> {
      await db.delete(emotionRecords).where(eq(emotionRecords.entryId, entryId));

      if (emotions.length === 0) {
        return [];
      }

      const now = Date.now();
      const records: EmotionRecord[] = emotions.map((emotion) => ({
        id: generateId(),
        entryId,
        category: emotion.category,
        intensity: emotion.intensity,
        createdAt: now,
      }));

      await db.insert(emotionRecords).values(
        records.map((record) => ({
          id: record.id,
          entryId: record.entryId,
          category: record.category,
          intensity: record.intensity,
          createdAt: new Date(record.createdAt),
        })),
      );

      return records;
    },

    async getByEntry(entryId): Promise<readonly EmotionRecord[]> {
      const rows = await db
        .select()
        .from(emotionRecords)
        .where(eq(emotionRecords.entryId, entryId))
        .orderBy(desc(emotionRecords.intensity));

      return rows.map(toEmotionRecord);
    },

    async getDominantMoodForDay(date): Promise<DayMood> {
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);

      const dayEntries = await db
        .select({ id: entries.id })
        .from(entries)
        .where(and(gte(entries.createdAt, startOfDay), lte(entries.createdAt, endOfDay)));

      if (dayEntries.length === 0) {
        return { date, dominantEmotion: undefined, intensity: undefined, hasEntry: false };
      }

      const entryIds = dayEntries.map((e) => e.id);
      const allEmotions: Array<typeof emotionRecords.$inferSelect> = [];

      for (const eid of entryIds) {
        const rows = await db
          .select()
          .from(emotionRecords)
          .where(eq(emotionRecords.entryId, eid));
        allEmotions.push(...rows);
      }

      if (allEmotions.length === 0) {
        return { date, dominantEmotion: undefined, intensity: undefined, hasEntry: true };
      }

      const highest = allEmotions.reduce((best, current) =>
        current.intensity > best.intensity ? current : best,
      );

      return {
        date,
        dominantEmotion: highest.category as EmotionCategory,
        intensity: highest.intensity,
        hasEntry: true,
      };
    },
  };
}

function toEmotionRecord(row: typeof emotionRecords.$inferSelect): EmotionRecord {
  return {
    id: row.id,
    entryId: row.entryId,
    category: row.category as EmotionCategory,
    intensity: row.intensity as EmotionRecord['intensity'],
    createdAt: row.createdAt.getTime(),
  };
}
