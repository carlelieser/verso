import { eq } from 'drizzle-orm';

import type { Db } from '@/db/client';
import { emotionRecords } from '@/db/schema';
import { isEmotionCategory, isEmotionIntensity } from '@/types/common';
import type { EmotionInput, EmotionRecord } from '@/types/emotion';
import { generateId } from '@/utils/id';

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

export async function getEmotions(db: Db, entryId: string): Promise<readonly EmotionRecord[]> {
  const rows = await db
    .select()
    .from(emotionRecords)
    .where(eq(emotionRecords.entryId, entryId));

  const result: EmotionRecord[] = [];
  for (const row of rows) {
    if (isEmotionCategory(row.category) && isEmotionIntensity(row.intensity)) {
      result.push({
        id: row.id,
        entryId: row.entryId,
        category: row.category,
        intensity: row.intensity,
        createdAt: row.createdAt.getTime(),
      });
    }
  }
  return result;
}
