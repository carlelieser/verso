import { desc, eq } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

import { emotionRecords, entries, journals } from '@/db/schema';
import type { EmotionCategory, EmotionIntensity } from '@/types/common';
import type { EmotionRecord } from '@/types/emotion';
import type { Entry } from '@/types/entry';
import { generateId } from '@/utils/id';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = ExpoSQLiteDatabase<any>;

interface CreateEntryInput {
  readonly journalId: string;
  readonly contentHtml: string;
  readonly contentText: string;
}

interface UpdateEntryInput {
  readonly id: string;
  readonly contentHtml: string;
  readonly contentText: string;
}

interface ListEntriesInput {
  readonly userId: string;
  readonly journalId?: string;
  readonly limit?: number;
  readonly offset?: number;
}

export interface EntryWithJournal extends Entry {
  readonly journalName: string;
}

export interface EntryWithEmotions extends Entry {
  readonly emotions: readonly EmotionRecord[];
}

function toEntry(row: {
  id: string;
  journalId: string;
  contentHtml: string;
  contentText: string;
  createdAt: Date;
  updatedAt: Date;
}): Entry {
  return {
    id: row.id,
    journalId: row.journalId,
    contentHtml: row.contentHtml,
    contentText: row.contentText,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  };
}

export async function createEntry(db: Db, input: CreateEntryInput): Promise<Entry> {
  const now = new Date();
  const id = generateId();

  await db.insert(entries).values({
    id,
    journalId: input.journalId,
    contentHtml: input.contentHtml,
    contentText: input.contentText,
    createdAt: now,
    updatedAt: now,
  });

  return {
    id,
    journalId: input.journalId,
    contentHtml: input.contentHtml,
    contentText: input.contentText,
    createdAt: now.getTime(),
    updatedAt: now.getTime(),
  };
}

export async function updateEntry(db: Db, input: UpdateEntryInput): Promise<void> {
  await db
    .update(entries)
    .set({
      contentHtml: input.contentHtml,
      contentText: input.contentText,
      updatedAt: new Date(),
    })
    .where(eq(entries.id, input.id));
}

export async function deleteEntry(db: Db, id: string): Promise<void> {
  await db.delete(entries).where(eq(entries.id, id));
}

export async function getEntry(db: Db, id: string): Promise<EntryWithEmotions | null> {
  const [row] = await db.select().from(entries).where(eq(entries.id, id)).limit(1);

  if (!row) return null;

  const emotions = await db
    .select()
    .from(emotionRecords)
    .where(eq(emotionRecords.entryId, id));

  return {
    ...toEntry(row),
    emotions: emotions.map((e) => ({
      id: e.id,
      entryId: e.entryId,
      category: e.category as EmotionCategory,
      intensity: e.intensity as EmotionIntensity,
      createdAt: e.createdAt.getTime(),
    })),
  };
}

export async function listEntries(db: Db, input: ListEntriesInput): Promise<EntryWithJournal[]> {
  const limit = input.limit ?? 50;
  const offset = input.offset ?? 0;

  const baseFilter = input.journalId
    ? eq(entries.journalId, input.journalId)
    : eq(journals.userId, input.userId);

  const rows = await db
    .select({
      id: entries.id,
      journalId: entries.journalId,
      contentHtml: entries.contentHtml,
      contentText: entries.contentText,
      createdAt: entries.createdAt,
      updatedAt: entries.updatedAt,
      journalName: journals.name,
    })
    .from(entries)
    .innerJoin(journals, eq(entries.journalId, journals.id))
    .where(baseFilter)
    .orderBy(desc(entries.createdAt))
    .limit(limit)
    .offset(offset);

  return rows.map((row) => ({
    ...toEntry(row as unknown as { id: string; journalId: string; contentHtml: string; contentText: string; createdAt: Date; updatedAt: Date }),
    journalName: row.journalName,
  }));
}

export async function searchEntries(db: Db, query: string): Promise<EntryWithJournal[]> {
  const rawDb = (db as unknown as { $client: { getAllSync: (sql: string, params: unknown[]) => unknown[] } }).$client;

  const rows = rawDb.getAllSync(
    `SELECT e.id, e.journal_id, e.content_html, e.content_text, e.created_at, e.updated_at, j.name as journal_name
     FROM entry_fts fts
     JOIN entry e ON e.rowid = fts.rowid
     JOIN journal j ON j.id = e.journal_id
     WHERE entry_fts MATCH ?
     ORDER BY rank`,
    [query],
  ) as Array<{
    id: string;
    journal_id: string;
    content_html: string;
    content_text: string;
    created_at: number;
    updated_at: number;
    journal_name: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    journalId: row.journal_id,
    contentHtml: row.content_html,
    contentText: row.content_text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    journalName: row.journal_name,
  }));
}
