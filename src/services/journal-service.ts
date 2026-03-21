import { eq, sql } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

import { journals } from '@/db/schema';
import { JournalNotFoundError } from '@/errors/domain-errors';
import type { Journal } from '@/types/journal';
import { generateId } from '@/utils/id';

interface CreateJournalParams {
  readonly name: string;
  readonly userId: string;
}

export function createJournalService(db: ExpoSQLiteDatabase): {
  create: (params: CreateJournalParams) => Promise<Journal>;
  getAll: (userId: string) => Promise<readonly Journal[]>;
  getById: (id: string) => Promise<Journal | undefined>;
  rename: (id: string, name: string) => Promise<void>;
  reorder: (orderedIds: readonly string[]) => Promise<void>;
  delete: (id: string) => Promise<void>;
} {
  return {
    async create({ name, userId }): Promise<Journal> {
      const now = Date.now();
      const id = generateId();

      const maxOrderResult = await db
        .select({ maxOrder: sql<number>`COALESCE(MAX(${journals.displayOrder}), -1)` })
        .from(journals)
        .where(eq(journals.userId, userId));

      const displayOrder = (maxOrderResult[0]?.maxOrder ?? -1) + 1;

      const journal: Journal = {
        id,
        userId,
        name,
        displayOrder,
        createdAt: now,
        updatedAt: now,
      };

      await db.insert(journals).values({
        id,
        userId,
        name,
        displayOrder,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      });

      return journal;
    },

    async getAll(userId): Promise<readonly Journal[]> {
      const rows = await db
        .select()
        .from(journals)
        .where(eq(journals.userId, userId))
        .orderBy(journals.displayOrder);

      return rows.map(toJournal);
    },

    async getById(id): Promise<Journal | undefined> {
      const rows = await db.select().from(journals).where(eq(journals.id, id)).limit(1);
      const row = rows[0];
      return row ? toJournal(row) : undefined;
    },

    async rename(id, name): Promise<void> {
      const result = await db
        .update(journals)
        .set({ name, updatedAt: new Date() })
        .where(eq(journals.id, id));

      if (result.changes === 0) {
        throw new JournalNotFoundError(id);
      }
    },

    async reorder(orderedIds): Promise<void> {
      for (let i = 0; i < orderedIds.length; i++) {
        const journalId = orderedIds[i];
        if (journalId) {
          await db
            .update(journals)
            .set({ displayOrder: i, updatedAt: new Date() })
            .where(eq(journals.id, journalId));
        }
      }
    },

    async delete(id): Promise<void> {
      const result = await db.delete(journals).where(eq(journals.id, id));
      if (result.changes === 0) {
        throw new JournalNotFoundError(id);
      }
    },
  };
}

function toJournal(row: typeof journals.$inferSelect): Journal {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    displayOrder: row.displayOrder,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  };
}
