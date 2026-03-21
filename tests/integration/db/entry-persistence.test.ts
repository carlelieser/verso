/**
 * Integration test: Entry persistence contract
 *
 * These tests document the expected behavior of entry persistence through
 * the full write-read cycle. In a real integration environment these would
 * run against an actual SQLite database. Here we simulate the cycle with
 * mocked DB operations to verify the service layer correctly round-trips
 * data through the persistence boundary.
 */

import { createEntryService } from '@/services/entry-service';

jest.mock('@/utils/id', () => ({
  generateId: jest.fn(() => 'persistence-test-uuid'),
}));

/**
 * Simulates a database that stores rows in memory, allowing us to verify
 * write-then-read semantics without a real SQLite connection.
 */
function createInMemoryMockDb(): {
  db: Record<string, unknown>;
  getStoredEntries: () => Array<Record<string, unknown>>;
} {
  const storedEntries: Array<Record<string, unknown>> = [];

  const insertChain = {
    values: jest.fn((values: Record<string, unknown>) => {
      storedEntries.push({ ...values });
      return Promise.resolve();
    }),
  };

  const buildSelectChain = (): Record<string, jest.Mock> => {
    let filterFn: ((row: Record<string, unknown>) => boolean) | undefined;
    let limitValue: number | undefined;

    const chain: Record<string, jest.Mock> = {
      from: jest.fn().mockImplementation(() => chain),
      where: jest.fn().mockImplementation((predicate: unknown) => {
        // We capture the intent but match by stored id since we cannot
        // evaluate real drizzle predicates in a mock environment.
        filterFn = predicate as ((row: Record<string, unknown>) => boolean) | undefined;
        void filterFn; // acknowledge capture
        return chain;
      }),
      orderBy: jest.fn().mockImplementation(() => chain),
      limit: jest.fn().mockImplementation((n: number) => {
        limitValue = n;
        return chain;
      }),
      offset: jest.fn().mockImplementation(() => chain),
      then: jest.fn().mockImplementation((resolve: (value: unknown) => void) => {
        const results = limitValue !== undefined ? storedEntries.slice(0, limitValue) : storedEntries;
        return resolve(results);
      }),
    };

    Object.defineProperty(chain, Symbol.toStringTag, { value: 'Promise' });
    return chain;
  };

  const db = {
    select: jest.fn(() => buildSelectChain()),
    insert: jest.fn(() => insertChain),
    update: jest.fn(() => ({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue({ changes: 1 }),
      }),
    })),
    delete: jest.fn(() => ({
      where: jest.fn().mockResolvedValue({ changes: 1 }),
    })),
  };

  return {
    db: db as Record<string, unknown>,
    getStoredEntries: () => [...storedEntries],
  };
}

describe('entry persistence contract', () => {
  describe('write-then-read cycle for HTML content', () => {
    it('should preserve entry data through the write path', async () => {
      const { db, getStoredEntries } = createInMemoryMockDb();
      const service = createEntryService(db as never);

      const entry = await service.create({ journalId: 'journal-1' });

      expect(entry.id).toBe('persistence-test-uuid');
      expect(entry.contentHtml).toBe('');
      expect(entry.contentText).toBe('');

      const stored = getStoredEntries();
      expect(stored).toHaveLength(1);
      expect(stored[0]).toMatchObject({
        id: 'persistence-test-uuid',
        journalId: 'journal-1',
        contentHtml: '',
        contentText: '',
      });
    });

    it('should persist HTML content through updateContent without data loss', async () => {
      const htmlContent = '<h1>My Entry</h1><p>Rich <strong>formatted</strong> content with <em>emphasis</em></p>';
      const textContent = 'My Entry\nRich formatted content with emphasis';

      let capturedSetArgs: Record<string, unknown> | undefined;

      const db = {
        select: jest.fn(() => {
          const chain: Record<string, jest.Mock> = {
            from: jest.fn().mockImplementation(() => chain),
            where: jest.fn().mockImplementation(() => chain),
            orderBy: jest.fn().mockImplementation(() => chain),
            limit: jest.fn().mockImplementation(() => chain),
            offset: jest.fn().mockImplementation(() => chain),
            then: jest.fn((resolve: (value: unknown) => void) => resolve([])),
          };
          Object.defineProperty(chain, Symbol.toStringTag, { value: 'Promise' });
          return chain;
        }),
        insert: jest.fn(() => ({
          values: jest.fn().mockResolvedValue(undefined),
        })),
        update: jest.fn(() => ({
          set: jest.fn().mockImplementation((args: Record<string, unknown>) => {
            capturedSetArgs = args;
            return {
              where: jest.fn().mockResolvedValue({ changes: 1 }),
            };
          }),
        })),
        delete: jest.fn(() => ({
          where: jest.fn().mockResolvedValue({ changes: 1 }),
        })),
      };

      const service = createEntryService(db as never);
      await service.updateContent('entry-1', { contentHtml: htmlContent, contentText: textContent });

      expect(capturedSetArgs).toBeDefined();
      expect(capturedSetArgs?.contentHtml).toBe(htmlContent);
      expect(capturedSetArgs?.contentText).toBe(textContent);
    });

    it('should handle special characters in HTML content without corruption', async () => {
      const htmlWithSpecialChars = '<p>Quotes: &quot;hello&quot; &amp; apostrophe&#39;s</p>';
      const textWithSpecialChars = 'Quotes: "hello" & apostrophe\'s';

      let capturedSetArgs: Record<string, unknown> | undefined;

      const db = {
        select: jest.fn(),
        insert: jest.fn(),
        update: jest.fn(() => ({
          set: jest.fn().mockImplementation((args: Record<string, unknown>) => {
            capturedSetArgs = args;
            return {
              where: jest.fn().mockResolvedValue({ changes: 1 }),
            };
          }),
        })),
        delete: jest.fn(),
      };

      const service = createEntryService(db as never);
      await service.updateContent('entry-1', {
        contentHtml: htmlWithSpecialChars,
        contentText: textWithSpecialChars,
      });

      expect(capturedSetArgs?.contentHtml).toBe(htmlWithSpecialChars);
      expect(capturedSetArgs?.contentText).toBe(textWithSpecialChars);
    });

    it('should handle empty content fields as valid values', async () => {
      const { db } = createInMemoryMockDb();
      const service = createEntryService(db as never);

      const entry = await service.create({ journalId: 'journal-1' });

      // Empty strings are intentional defaults, not missing data
      expect(entry.contentHtml).toBe('');
      expect(entry.contentText).toBe('');
      expect(entry.contentHtml).not.toBeNull();
      expect(entry.contentText).not.toBeNull();
    });
  });

  describe('simulated close/reopen cycle', () => {
    it('should return persisted data after simulated database reconnection', async () => {
      // Phase 1: Write entry data to the "database"
      const storedRows: Array<Record<string, unknown>> = [];

      const writeDb = {
        select: jest.fn(() => {
          const chain: Record<string, jest.Mock> = {
            from: jest.fn().mockImplementation(() => chain),
            where: jest.fn().mockImplementation(() => chain),
            orderBy: jest.fn().mockImplementation(() => chain),
            limit: jest.fn().mockImplementation(() => chain),
            offset: jest.fn().mockImplementation(() => chain),
            then: jest.fn((resolve: (value: unknown) => void) => resolve([])),
          };
          Object.defineProperty(chain, Symbol.toStringTag, { value: 'Promise' });
          return chain;
        }),
        insert: jest.fn(() => ({
          values: jest.fn().mockImplementation((row: Record<string, unknown>) => {
            storedRows.push({ ...row });
            return Promise.resolve();
          }),
        })),
        update: jest.fn(),
        delete: jest.fn(),
      };

      const writeService = createEntryService(writeDb as never);
      const created = await writeService.create({ journalId: 'journal-1' });

      // Phase 2: Simulate "reopening" with a new db connection that reads
      // from the same backing store
      const readDb = {
        select: jest.fn(() => {
          const chain: Record<string, jest.Mock> = {
            from: jest.fn().mockImplementation(() => chain),
            where: jest.fn().mockImplementation(() => chain),
            orderBy: jest.fn().mockImplementation(() => chain),
            limit: jest.fn().mockImplementation(() => chain),
            offset: jest.fn().mockImplementation(() => chain),
            then: jest.fn((resolve: (value: unknown) => void) => {
              // Return rows with Date objects as the real DB layer would
              const rows = storedRows.map((row) => ({
                ...row,
                createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt as number),
                updatedAt: row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updatedAt as number),
              }));
              return resolve(rows);
            }),
          };
          Object.defineProperty(chain, Symbol.toStringTag, { value: 'Promise' });
          return chain;
        }),
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      };

      const readService = createEntryService(readDb as never);
      const retrieved = await readService.getByJournal('journal-1');

      expect(retrieved).toHaveLength(1);
      expect(retrieved[0]?.id).toBe(created.id);
      expect(retrieved[0]?.journalId).toBe('journal-1');
      expect(typeof retrieved[0]?.createdAt).toBe('number');
    });
  });
});
