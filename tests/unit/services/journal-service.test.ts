import { JournalNotFoundError } from '@/errors/domain-errors';
import { createJournalService } from '@/services/journal-service';

jest.mock('@/utils/id', () => ({
  generateId: jest.fn(() => 'mock-uuid-001'),
}));

/**
 * Builds a mock Drizzle database object that mimics the chainable query
 * builder pattern used by drizzle-orm. Each method returns `this` so
 * callers can chain `.from().where().orderBy()` etc.
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

  // Make the chain thenable so `await` works
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

describe('journalService', () => {
  describe('create', () => {
    it('should return a journal with a generated id and computed displayOrder', async () => {
      const mockDb = createMockDb({
        selectResult: [{ maxOrder: 2 }],
      });

      const service = createJournalService(mockDb as never);
      const journal = await service.create({ name: 'My Journal', userId: 'user-1' });

      expect(journal.id).toBe('mock-uuid-001');
      expect(journal.name).toBe('My Journal');
      expect(journal.userId).toBe('user-1');
      expect(journal.displayOrder).toBe(3);
      expect(typeof journal.createdAt).toBe('number');
      expect(typeof journal.updatedAt).toBe('number');
    });

    it('should default displayOrder to 0 when no journals exist', async () => {
      const mockDb = createMockDb({
        selectResult: [{ maxOrder: -1 }],
      });

      const service = createJournalService(mockDb as never);
      const journal = await service.create({ name: 'First Journal', userId: 'user-1' });

      expect(journal.displayOrder).toBe(0);
    });

    it('should insert a row into the journals table', async () => {
      const mockDb = createMockDb({
        selectResult: [{ maxOrder: -1 }],
      });

      const service = createJournalService(mockDb as never);
      await service.create({ name: 'Test', userId: 'user-1' });

      const insertFn = mockDb.insert as jest.Mock;
      expect(insertFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAll', () => {
    it('should return journals mapped through toJournal', async () => {
      const now = new Date();
      const mockDb = createMockDb({
        selectResult: [
          { id: 'j1', userId: 'user-1', name: 'A', displayOrder: 0, createdAt: now, updatedAt: now },
          { id: 'j2', userId: 'user-1', name: 'B', displayOrder: 1, createdAt: now, updatedAt: now },
        ],
      });

      const service = createJournalService(mockDb as never);
      const journals = await service.getAll('user-1');

      expect(journals).toHaveLength(2);
      expect(journals[0]?.name).toBe('A');
      expect(journals[1]?.name).toBe('B');
      expect(typeof journals[0]?.createdAt).toBe('number');
    });

    it('should return an empty array when no journals exist', async () => {
      const mockDb = createMockDb({ selectResult: [] });

      const service = createJournalService(mockDb as never);
      const journals = await service.getAll('user-1');

      expect(journals).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should return a journal when found', async () => {
      const now = new Date();
      const mockDb = createMockDb({
        selectResult: [
          { id: 'j1', userId: 'user-1', name: 'Found', displayOrder: 0, createdAt: now, updatedAt: now },
        ],
      });

      const service = createJournalService(mockDb as never);
      const journal = await service.getById('j1');

      expect(journal).toBeDefined();
      expect(journal?.id).toBe('j1');
    });

    it('should return undefined when journal is not found', async () => {
      const mockDb = createMockDb({ selectResult: [] });

      const service = createJournalService(mockDb as never);
      const journal = await service.getById('nonexistent');

      expect(journal).toBeUndefined();
    });
  });

  describe('rename', () => {
    it('should not throw when the journal exists', async () => {
      const mockDb = createMockDb({ updateResult: { changes: 1 } });

      const service = createJournalService(mockDb as never);

      await expect(service.rename('j1', 'New Name')).resolves.toBeUndefined();
    });

    it('should throw JournalNotFoundError when the journal does not exist', async () => {
      const mockDb = createMockDb({ updateResult: { changes: 0 } });

      const service = createJournalService(mockDb as never);

      await expect(service.rename('nonexistent', 'Name')).rejects.toThrow(JournalNotFoundError);
    });

    it('should include the journal id in the error message', async () => {
      const mockDb = createMockDb({ updateResult: { changes: 0 } });

      const service = createJournalService(mockDb as never);

      await expect(service.rename('abc-123', 'Name')).rejects.toThrow('Journal not found: abc-123');
    });
  });

  describe('reorder', () => {
    it('should call update for each id with the correct displayOrder', async () => {
      const updateWhere = jest.fn().mockResolvedValue({ changes: 1 });
      const updateSet = jest.fn().mockReturnValue({ where: updateWhere });
      const mockDb = {
        select: jest.fn(),
        insert: jest.fn(),
        update: jest.fn(() => ({ set: updateSet })),
        delete: jest.fn(),
      };

      const service = createJournalService(mockDb as never);
      await service.reorder(['id-a', 'id-b', 'id-c']);

      expect(updateSet).toHaveBeenCalledTimes(3);

      // Verify each call sets the correct displayOrder index
      const setArgs = updateSet.mock.calls.map(
        (call: [{ displayOrder: number; updatedAt: Date }]) => call[0].displayOrder,
      );
      expect(setArgs).toEqual([0, 1, 2]);
    });

    it('should handle an empty array without calling update', async () => {
      const updateFn = jest.fn();
      const mockDb = {
        select: jest.fn(),
        insert: jest.fn(),
        update: updateFn,
        delete: jest.fn(),
      };

      const service = createJournalService(mockDb as never);
      await service.reorder([]);

      expect(updateFn).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should not throw when the journal exists', async () => {
      const mockDb = createMockDb({ deleteResult: { changes: 1 } });

      const service = createJournalService(mockDb as never);

      await expect(service.delete('j1')).resolves.toBeUndefined();
    });

    it('should throw JournalNotFoundError when the journal does not exist', async () => {
      const mockDb = createMockDb({ deleteResult: { changes: 0 } });

      const service = createJournalService(mockDb as never);

      await expect(service.delete('nonexistent')).rejects.toThrow(JournalNotFoundError);
    });

    it('should include the journal id in the error message', async () => {
      const mockDb = createMockDb({ deleteResult: { changes: 0 } });

      const service = createJournalService(mockDb as never);

      await expect(service.delete('xyz-789')).rejects.toThrow('Journal not found: xyz-789');
    });
  });
});
