import { EntryNotFoundError } from '@/errors/domain-errors';
import { createEntryService } from '@/services/entry-service';

jest.mock('@/utils/id', () => ({
  generateId: jest.fn(() => 'mock-entry-uuid-001'),
}));

/**
 * Builds a mock Drizzle database object that mimics the chainable query
 * builder pattern used by drizzle-orm.
 */
function createMockDb(overrides: {
  selectResult?: unknown[];
  insertResult?: unknown;
  updateResult?: { changes: number };
  deleteResult?: { changes: number };
} = {}): Record<string, unknown> {
  const selectChain = {
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    then: jest.fn((resolve: (value: unknown) => void) => resolve(overrides.selectResult ?? [])),
    [Symbol.toStringTag]: 'Promise',
  };

  selectChain.from.mockReturnValue(selectChain);
  selectChain.where.mockReturnValue(selectChain);
  selectChain.orderBy.mockReturnValue(selectChain);
  selectChain.limit.mockReturnValue(selectChain);
  selectChain.offset.mockReturnValue(selectChain);

  const insertChain = {
    values: jest.fn().mockResolvedValue(overrides.insertResult ?? undefined),
  };

  const updateChain = {
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockResolvedValue(overrides.updateResult ?? { changes: 1 }),
  };

  const deleteChain = {
    where: jest.fn().mockResolvedValue(overrides.deleteResult ?? { changes: 1 }),
  };

  return {
    select: jest.fn(() => selectChain),
    insert: jest.fn(() => insertChain),
    update: jest.fn(() => updateChain),
    delete: jest.fn(() => deleteChain),
  };
}

describe('entryService', () => {
  describe('create', () => {
    it('should return an entry with a generated id and empty content', async () => {
      const mockDb = createMockDb();

      const service = createEntryService(mockDb as never);
      const entry = await service.create({ journalId: 'journal-1' });

      expect(entry.id).toBe('mock-entry-uuid-001');
      expect(entry.journalId).toBe('journal-1');
      expect(entry.contentHtml).toBe('');
      expect(entry.contentText).toBe('');
      expect(typeof entry.createdAt).toBe('number');
      expect(typeof entry.updatedAt).toBe('number');
    });

    it('should insert a row into the entries table', async () => {
      const mockDb = createMockDb();

      const service = createEntryService(mockDb as never);
      await service.create({ journalId: 'journal-1' });

      const insertFn = mockDb.insert as jest.Mock;
      expect(insertFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('getById', () => {
    it('should return an entry when found', async () => {
      const now = new Date();
      const mockDb = createMockDb({
        selectResult: [
          { id: 'e1', journalId: 'j1', contentHtml: '<p>hi</p>', contentText: 'hi', createdAt: now, updatedAt: now },
        ],
      });

      const service = createEntryService(mockDb as never);
      const entry = await service.getById('e1');

      expect(entry).toBeDefined();
      expect(entry?.id).toBe('e1');
      expect(entry?.contentHtml).toBe('<p>hi</p>');
    });

    it('should return undefined when entry is not found', async () => {
      const mockDb = createMockDb({ selectResult: [] });

      const service = createEntryService(mockDb as never);
      const entry = await service.getById('nonexistent');

      expect(entry).toBeUndefined();
    });
  });

  describe('getByJournal', () => {
    it('should return entries mapped through toEntry', async () => {
      const now = new Date();
      const mockDb = createMockDb({
        selectResult: [
          { id: 'e1', journalId: 'j1', contentHtml: '', contentText: '', createdAt: now, updatedAt: now },
          { id: 'e2', journalId: 'j1', contentHtml: '', contentText: '', createdAt: now, updatedAt: now },
        ],
      });

      const service = createEntryService(mockDb as never);
      const entries = await service.getByJournal('j1');

      expect(entries).toHaveLength(2);
      expect(typeof entries[0]?.createdAt).toBe('number');
    });

    it('should apply default limit of 20 and offset of 0 when no params provided', async () => {
      const selectChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        then: jest.fn((resolve: (value: unknown) => void) => resolve([])),
        [Symbol.toStringTag]: 'Promise',
      };

      selectChain.from.mockReturnValue(selectChain);
      selectChain.where.mockReturnValue(selectChain);
      selectChain.orderBy.mockReturnValue(selectChain);
      selectChain.limit.mockReturnValue(selectChain);
      selectChain.offset.mockReturnValue(selectChain);

      const mockDb = {
        select: jest.fn(() => selectChain),
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      };

      const service = createEntryService(mockDb as never);
      await service.getByJournal('j1');

      expect(selectChain.limit).toHaveBeenCalledWith(20);
      expect(selectChain.offset).toHaveBeenCalledWith(0);
    });

    it('should use provided limit and offset values', async () => {
      const selectChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        then: jest.fn((resolve: (value: unknown) => void) => resolve([])),
        [Symbol.toStringTag]: 'Promise',
      };

      selectChain.from.mockReturnValue(selectChain);
      selectChain.where.mockReturnValue(selectChain);
      selectChain.orderBy.mockReturnValue(selectChain);
      selectChain.limit.mockReturnValue(selectChain);
      selectChain.offset.mockReturnValue(selectChain);

      const mockDb = {
        select: jest.fn(() => selectChain),
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      };

      const service = createEntryService(mockDb as never);
      await service.getByJournal('j1', { limit: 5, offset: 10 });

      expect(selectChain.limit).toHaveBeenCalledWith(5);
      expect(selectChain.offset).toHaveBeenCalledWith(10);
    });

    it('should return an empty array when no entries exist', async () => {
      const mockDb = createMockDb({ selectResult: [] });

      const service = createEntryService(mockDb as never);
      const entries = await service.getByJournal('j1');

      expect(entries).toEqual([]);
    });
  });

  describe('updateContent', () => {
    it('should not throw when the entry exists', async () => {
      const mockDb = createMockDb({ updateResult: { changes: 1 } });

      const service = createEntryService(mockDb as never);

      await expect(
        service.updateContent('e1', { contentHtml: '<p>updated</p>', contentText: 'updated' }),
      ).resolves.toBeUndefined();
    });

    it('should throw EntryNotFoundError when the entry does not exist', async () => {
      const mockDb = createMockDb({ updateResult: { changes: 0 } });

      const service = createEntryService(mockDb as never);

      await expect(
        service.updateContent('nonexistent', { contentHtml: '<p>x</p>', contentText: 'x' }),
      ).rejects.toThrow(EntryNotFoundError);
    });

    it('should include the entry id in the error message', async () => {
      const mockDb = createMockDb({ updateResult: { changes: 0 } });

      const service = createEntryService(mockDb as never);

      await expect(
        service.updateContent('abc-456', { contentHtml: '', contentText: '' }),
      ).rejects.toThrow('Entry not found: abc-456');
    });
  });

  describe('delete', () => {
    it('should not throw when the entry exists', async () => {
      const mockDb = createMockDb({ deleteResult: { changes: 1 } });

      const service = createEntryService(mockDb as never);

      await expect(service.delete('e1')).resolves.toBeUndefined();
    });

    it('should throw EntryNotFoundError when the entry does not exist', async () => {
      const mockDb = createMockDb({ deleteResult: { changes: 0 } });

      const service = createEntryService(mockDb as never);

      await expect(service.delete('nonexistent')).rejects.toThrow(EntryNotFoundError);
    });

    it('should include the entry id in the error message', async () => {
      const mockDb = createMockDb({ deleteResult: { changes: 0 } });

      const service = createEntryService(mockDb as never);

      await expect(service.delete('def-789')).rejects.toThrow('Entry not found: def-789');
    });
  });
});
