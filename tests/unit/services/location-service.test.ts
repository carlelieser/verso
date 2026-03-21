import { createLocationService } from '@/services/location-service';

jest.mock('@/utils/id', () => ({
  generateId: jest.fn(() => 'mock-location-id'),
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));

/**
 * Builds a mock Drizzle database object that mimics the chainable query
 * builder pattern used by drizzle-orm.
 */
function createMockDb(overrides: {
  selectResult?: unknown[];
  deleteResult?: { changes: number };
} = {}): Record<string, unknown> {
  const selectChain = {
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    then: jest.fn((resolve: (value: unknown) => void) => resolve(overrides.selectResult ?? [])),
    [Symbol.toStringTag]: 'Promise',
  };

  selectChain.from.mockReturnValue(selectChain);
  selectChain.where.mockReturnValue(selectChain);
  selectChain.limit.mockReturnValue(selectChain);

  const insertChain = {
    values: jest.fn().mockResolvedValue(undefined),
  };

  const deleteChain = {
    where: jest.fn().mockResolvedValue(overrides.deleteResult ?? { changes: 1 }),
  };

  return {
    select: jest.fn(() => selectChain),
    insert: jest.fn(() => insertChain),
    delete: jest.fn(() => deleteChain),
  };
}

describe('locationService', () => {
  describe('setManual', () => {
    it('should create a location with null latitude and longitude', async () => {
      const mockDb = createMockDb();
      const service = createLocationService(mockDb as never);

      const location = await service.setManual('entry-1', 'Coffee Shop');

      expect(location.id).toBe('mock-location-id');
      expect(location.entryId).toBe('entry-1');
      expect(location.name).toBe('Coffee Shop');
      expect(location.latitude).toBeNull();
      expect(location.longitude).toBeNull();
      expect(typeof location.createdAt).toBe('number');
    });

    it('should delete existing location before inserting', async () => {
      const mockDb = createMockDb();
      const service = createLocationService(mockDb as never);

      await service.setManual('entry-1', 'Library');

      const deleteFn = mockDb.delete as jest.Mock;
      expect(deleteFn).toHaveBeenCalledTimes(1);

      const insertFn = mockDb.insert as jest.Mock;
      expect(insertFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('getByEntry', () => {
    it('should return undefined when no location exists for the entry', async () => {
      const mockDb = createMockDb({ selectResult: [] });
      const service = createLocationService(mockDb as never);

      const result = await service.getByEntry('entry-no-location');

      expect(result).toBeUndefined();
    });

    it('should return a location when one exists', async () => {
      const now = new Date();
      const mockDb = createMockDb({
        selectResult: [
          {
            id: 'loc-1',
            entryId: 'entry-1',
            name: 'Paris',
            latitude: 48.8566,
            longitude: 2.3522,
            createdAt: now,
          },
        ],
      });
      const service = createLocationService(mockDb as never);

      const result = await service.getByEntry('entry-1');

      expect(result).toBeDefined();
      expect(result?.name).toBe('Paris');
      expect(result?.latitude).toBe(48.8566);
      expect(typeof result?.createdAt).toBe('number');
    });
  });

  describe('remove', () => {
    it('should call delete on the database', async () => {
      const mockDb = createMockDb();
      const service = createLocationService(mockDb as never);

      await service.remove('entry-1');

      const deleteFn = mockDb.delete as jest.Mock;
      expect(deleteFn).toHaveBeenCalledTimes(1);
    });
  });
});
