import { createEmotionService } from "@/services/emotion-service";

import type { EmotionCategory } from "@/types";

const mockDelete = jest.fn().mockReturnThis();
const mockWhere = jest.fn().mockReturnThis();
const mockInsert = jest.fn().mockReturnThis();
const mockValues = jest.fn().mockReturnThis();
const mockReturning = jest.fn();
const mockSelect = jest.fn().mockReturnThis();
const mockFrom = jest.fn().mockReturnThis();
const mockOrderBy = jest.fn();
const mockGetAllSync = jest.fn();

const mockDb = {
  delete: mockDelete,
  insert: mockInsert,
  select: mockSelect,
  $client: { getAllSync: mockGetAllSync },
} as unknown as Parameters<typeof createEmotionService>[0];

// Wire up chained methods
mockDelete.mockReturnValue({ where: mockWhere });
mockWhere.mockReturnValue({ returning: mockReturning });
mockInsert.mockReturnValue({ values: mockValues });
mockValues.mockReturnValue({ returning: mockReturning });
mockSelect.mockReturnValue({ from: mockFrom });
mockFrom.mockReturnValue({ where: mockWhere });
mockWhere.mockReturnValue({ orderBy: mockOrderBy });

jest.mock("@/db/schema", () => ({
  emotionRecord: { id: "id", entryId: "entryId", category: "category", intensity: "intensity", createdAt: "createdAt" },
}));

jest.mock("@/db/client", () => ({
  getRawClient: jest.fn(() => ({ $client: { getAllSync: mockGetAllSync } })),
}));

jest.mock("drizzle-orm", () => ({
  eq: jest.fn((...args: unknown[]) => ({ type: "eq", args })),
  desc: jest.fn((col: unknown) => ({ type: "desc", col })),
  sql: jest.fn(),
}));

jest.mock("uuid", () => ({
  v4: jest.fn(() => "mock-uuid-1234"),
}));

describe("EmotionService", () => {
  let service: ReturnType<typeof createEmotionService>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = createEmotionService(mockDb);
  });

  describe("setEmotions", () => {
    it("replaces all emotions for an entry", async () => {
      const entryId = "entry-1";
      const emotions = [
        { category: "happy" as EmotionCategory, intensity: 4 as const },
        { category: "grateful" as EmotionCategory, intensity: 3 as const },
      ];

      const expectedRecords = emotions.map((e, i) => ({
        id: `mock-uuid-1234`,
        entryId,
        category: e.category,
        intensity: e.intensity,
        createdAt: Date.now(),
      }));

      mockReturning.mockResolvedValueOnce([]).mockResolvedValueOnce(expectedRecords);

      const result = await service.setEmotions(entryId, emotions);

      expect(mockDelete).toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalled();
      expect(result).toEqual(expectedRecords);
    });

    it("clears emotions when given an empty array", async () => {
      const entryId = "entry-1";

      mockReturning.mockResolvedValueOnce([]);

      const result = await service.setEmotions(entryId, []);

      expect(mockDelete).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe("getByEntry", () => {
    it("returns emotions sorted by intensity DESC", async () => {
      const entryId = "entry-1";
      const emotions = [
        { id: "e1", entryId, category: "excited", intensity: 5, createdAt: 1000 },
        { id: "e2", entryId, category: "calm", intensity: 3, createdAt: 1001 },
        { id: "e3", entryId, category: "tired", intensity: 1, createdAt: 1002 },
      ];

      mockOrderBy.mockResolvedValueOnce(emotions);

      const result = await service.getByEntry(entryId);

      expect(result).toEqual(emotions);
      expect(result[0].intensity).toBeGreaterThanOrEqual(result[1].intensity);
      expect(result[1].intensity).toBeGreaterThanOrEqual(result[2].intensity);
    });
  });

  describe("getDominantMoodForDay", () => {
    it("returns undefined mood when no entries exist for date", async () => {
      mockGetAllSync.mockReturnValueOnce([]);

      const result = await service.getDominantMoodForDay("2026-03-20");

      expect(result).toEqual(
        expect.objectContaining({
          date: "2026-03-20",
          dominantEmotion: undefined,
          intensity: undefined,
          hasEntry: false,
        }),
      );
    });

    it("returns undefined mood when entries have no emotions", async () => {
      mockGetAllSync.mockReturnValueOnce([{ id: "entry-1" }]);
      mockGetAllSync.mockReturnValueOnce([]);

      const result = await service.getDominantMoodForDay("2026-03-20");

      expect(result).toEqual(
        expect.objectContaining({
          date: "2026-03-20",
          dominantEmotion: undefined,
          intensity: undefined,
          hasEntry: true,
        }),
      );
    });

    it("returns highest intensity emotion as dominant", async () => {
      mockGetAllSync.mockReturnValueOnce([{ id: "entry-1" }]);
      mockGetAllSync.mockReturnValueOnce([
        { category: "calm", intensity: 2 },
        { category: "excited", intensity: 5 },
        { category: "happy", intensity: 3 },
      ]);

      const result = await service.getDominantMoodForDay("2026-03-20");

      expect(result).toEqual(
        expect.objectContaining({
          date: "2026-03-20",
          dominantEmotion: "excited",
          intensity: 5,
          hasEntry: true,
        }),
      );
    });
  });
});
