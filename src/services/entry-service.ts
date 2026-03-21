import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

import { entries } from '@/db/schema';
import { EntryNotFoundError } from '@/errors/domain-errors';
import type { EmotionCategory } from '@/types/common';
import type { Entry } from '@/types/entry';
import { generateId } from '@/utils/id';

interface PaginationParams {
  readonly limit?: number;
  readonly offset?: number;
}

interface UpdateContentParams {
  readonly contentHtml: string;
  readonly contentText: string;
}

interface DateRangeParams {
  readonly start: Date;
  readonly end: Date;
}

export function createEntryService(db: ExpoSQLiteDatabase): {
  create: (params: { journalId: string }) => Promise<Entry>;
  getById: (id: string) => Promise<Entry | undefined>;
  getByJournal: (journalId: string, params?: PaginationParams) => Promise<readonly Entry[]>;
  getByDate: (journalId: string, date: string) => Promise<readonly Entry[]>;
  updateContent: (id: string, params: UpdateContentParams) => Promise<void>;
  delete: (id: string) => Promise<void>;
  search: (journalId: string, query: string) => Promise<readonly Entry[]>;
  filterByEmotion: (journalId: string, category: EmotionCategory) => Promise<readonly Entry[]>;
  filterByDateRange: (journalId: string, params: DateRangeParams) => Promise<readonly Entry[]>;
} {
  return {
    async create({ journalId }): Promise<Entry> {
      const now = Date.now();
      const id = generateId();

      const entry: Entry = {
        id,
        journalId,
        contentHtml: '',
        contentText: '',
        createdAt: now,
        updatedAt: now,
      };

      await db.insert(entries).values({
        id,
        journalId,
        contentHtml: '',
        contentText: '',
        createdAt: new Date(now),
        updatedAt: new Date(now),
      });

      return entry;
    },

    async getById(id): Promise<Entry | undefined> {
      const rows = await db.select().from(entries).where(eq(entries.id, id)).limit(1);
      const row = rows[0];
      return row ? toEntry(row) : undefined;
    },

    async getByJournal(journalId, params): Promise<readonly Entry[]> {
      const limit = params?.limit ?? 20;
      const offset = params?.offset ?? 0;

      const rows = await db
        .select()
        .from(entries)
        .where(eq(entries.journalId, journalId))
        .orderBy(desc(entries.createdAt))
        .limit(limit)
        .offset(offset);

      return rows.map(toEntry);
    },

    async getByDate(journalId, date): Promise<readonly Entry[]> {
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);

      const rows = await db
        .select()
        .from(entries)
        .where(
          and(
            eq(entries.journalId, journalId),
            gte(entries.createdAt, startOfDay),
            lte(entries.createdAt, endOfDay),
          ),
        )
        .orderBy(desc(entries.createdAt));

      return rows.map(toEntry);
    },

    async updateContent(id, { contentHtml, contentText }): Promise<void> {
      const result = await db
        .update(entries)
        .set({ contentHtml, contentText, updatedAt: new Date() })
        .where(eq(entries.id, id));

      if (result.changes === 0) {
        throw new EntryNotFoundError(id);
      }
    },

    async delete(id): Promise<void> {
      const result = await db.delete(entries).where(eq(entries.id, id));
      if (result.changes === 0) {
        throw new EntryNotFoundError(id);
      }
    },

    async search(journalId, query): Promise<readonly Entry[]> {
      const rawDb = (db as unknown as { $client: { getAllSync: (sql: string, params: unknown[]) => Array<Record<string, unknown>> } }).$client;
      const rows = rawDb.getAllSync(
        `SELECT e.* FROM entry e
         JOIN entry_fts ON entry_fts.rowid = e.rowid
         WHERE entry_fts MATCH ?
           AND e.journal_id = ?
         ORDER BY rank`,
        [query, journalId],
      );

      return rows.map(rawToEntry);
    },

    async filterByEmotion(journalId, category): Promise<readonly Entry[]> {
      const rawDb = (db as unknown as { $client: { getAllSync: (sql: string, params: unknown[]) => Array<Record<string, unknown>> } }).$client;
      const rows = rawDb.getAllSync(
        `SELECT DISTINCT e.* FROM entry e
         JOIN emotion_record er ON er.entry_id = e.id
         WHERE e.journal_id = ? AND er.category = ?
         ORDER BY e.created_at DESC`,
        [journalId, category],
      );

      return rows.map(rawToEntry);
    },

    async filterByDateRange(journalId, { start, end }): Promise<readonly Entry[]> {
      const rows = await db
        .select()
        .from(entries)
        .where(
          and(
            eq(entries.journalId, journalId),
            gte(entries.createdAt, start),
            lte(entries.createdAt, end),
          ),
        )
        .orderBy(desc(entries.createdAt));

      return rows.map(toEntry);
    },
  };
}

function toEntry(row: typeof entries.$inferSelect): Entry {
  return {
    id: row.id,
    journalId: row.journalId,
    contentHtml: row.contentHtml,
    contentText: row.contentText,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  };
}

function rawToEntry(row: Record<string, unknown>): Entry {
  return {
    id: row['id'] as string,
    journalId: row['journal_id'] as string,
    contentHtml: row['content_html'] as string,
    contentText: row['content_text'] as string,
    createdAt: row['created_at'] as number,
    updatedAt: row['updated_at'] as number,
  };
}
