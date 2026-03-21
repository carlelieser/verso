import { eq } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

import { emotionRecords } from '@/db/schema';
import type { EmotionCategory, EmotionIntensity } from '@/types/common';
import type { EmotionInput, EmotionRecord } from '@/types/emotion';
import { generateId } from '@/utils/id';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = ExpoSQLiteDatabase<any>;

export async function saveEmotions(
  db: Db,
  entryId: string,
  emotions: readonly EmotionInput[],
): Promise<void> {
  await db.delete(emotionRecords).where(eq(emotionRecords.entryId, entryId));

  if (emotions.length === 0) return;

  const now = new Date();

  await db.insert(emotionRecords).values(
    emotions.map((e) => ({
      id: generateId(),
      entryId,
      category: e.category,
      intensity: e.intensity,
      createdAt: now,
    })),
  );
}

export async function getEmotions(db: Db, entryId: string): Promise<EmotionRecord[]> {
  const rows = await db
    .select()
    .from(emotionRecords)
    .where(eq(emotionRecords.entryId, entryId));

  return rows.map((row) => ({
    id: row.id,
    entryId: row.entryId,
    category: row.category as EmotionCategory,
    intensity: row.intensity as EmotionIntensity,
    createdAt: row.createdAt.getTime(),
  }));
}
