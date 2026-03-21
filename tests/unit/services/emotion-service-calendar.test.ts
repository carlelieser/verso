import { createEmotionService } from "@/services/emotion-service";

const mockGetAllSync = jest.fn();

const mockDb = {} as unknown as Parameters<typeof createEmotionService>[0];

jest.mock("@/db/schema", () => ({
  emotionRecord: { id: "id", entryId: "entryId", category: "category", intensity: "intensity", createdAt: "createdAt" },
  journalEntry: { id: "id", createdAt: "createdAt" },
}));

jest.mock("@/db/client", () => ({
  getRawClient: jest.fn(() => ({ $client: { getAllSync: mockGetAllSync } })),
}));

jest.mock("drizzle-orm", () => ({
  eq: jest.fn((...args: unknown[]) => ({ type: "eq", args })),
  desc: jest.fn((col: unknown) => ({ type: "desc", col })),
  sql: jest.fn(),
}));

describe("EmotionService - Calendar dominant mood", () => {
  let service: ReturnType<typeof createEmotionService>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = createEmotionService(mockDb);
  });

  describe("getDominantMoodForDay", () => {
    it("returns highest intensity emotion when single entry has multiple emotions", async () => {
      mockGetAllSync.mockReturnValueOnce([{ id: "entry-1" }]);
      mockGetAllSync.mockReturnValueOnce([
        { category: "happy", intensity: 2 },
        { category: "excited", intensity: 5 },
        { category: "calm", intensity: 3 },
      ]);

      const result = await service.getDominantMoodForDay("2026-03-15");

      expect(result.dominantEmotion).toBe("excited");
      expect(result.intensity).toBe(5);
      expect(result.hasEntry).toBe(true);
    });

    it("returns highest intensity across all entries when day has multiple entries", async () => {
      mockGetAllSync.mockReturnValueOnce([
        { id: "entry-1" },
        { id: "entry-2" },
      ]);
      mockGetAllSync.mockReturnValueOnce([
        { category: "sad", intensity: 3 },
        { category: "anxious", intensity: 2 },
        { category: "grateful", intensity: 4 },
        { category: "hopeful", intensity: 5 },
      ]);

      const result = await service.getDominantMoodForDay("2026-03-15");

      expect(result.dominantEmotion).toBe("hopeful");
      expect(result.intensity).toBe(5);
      expect(result.hasEntry).toBe(true);
    });

    it("returns hasEntry false and no mood when no entries exist for the day", async () => {
      mockGetAllSync.mockReturnValueOnce([]);

      const result = await service.getDominantMoodForDay("2026-03-15");

      expect(result.hasEntry).toBe(false);
      expect(result.dominantEmotion).toBeUndefined();
      expect(result.intensity).toBeUndefined();
    });
  });
});
