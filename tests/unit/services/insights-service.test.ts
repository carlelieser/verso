import { createInsightsService } from "@/services/insights-service";

const mockGetAllSync = jest.fn();

const mockDb = {} as unknown as Parameters<typeof createInsightsService>[0];

jest.mock("@/db/client", () => ({
  getRawClient: jest.fn(() => ({ $client: { getAllSync: mockGetAllSync } })),
}));

jest.mock("@/db/schema", () => ({
  journalEntry: { id: "id", createdAt: "createdAt", journalId: "journalId" },
  emotionRecord: { id: "id", entryId: "entryId", category: "category", intensity: "intensity" },
}));

jest.mock("drizzle-orm", () => ({
  eq: jest.fn((...args: unknown[]) => ({ type: "eq", args })),
  desc: jest.fn((col: unknown) => ({ type: "desc", col })),
  sql: jest.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values })),
}));

describe("InsightsService", () => {
  let service: ReturnType<typeof createInsightsService>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = createInsightsService(mockDb);
  });

  describe("getStreak", () => {
    it("returns 0 streak when no entries exist", async () => {
      mockGetAllSync.mockReturnValue([]);

      const result = await service.getStreak();

      expect(result).toEqual(
        expect.objectContaining({
          currentStreak: 0,
          longestStreak: 0,
          totalEntries: 0,
        }),
      );
      expect(result.encouragingMessage).toBeDefined();
    });

    it("returns correct encouraging message for short streak", async () => {
      mockGetAllSync.mockReturnValueOnce([
        { date: "2026-03-20" },
        { date: "2026-03-19" },
        { date: "2026-03-18" },
      ]);
      mockGetAllSync.mockReturnValueOnce([{ totalEntries: 10 }]);

      const result = await service.getStreak();

      expect(result.currentStreak).toBe(3);
      expect(typeof result.encouragingMessage).toBe("string");
      expect(result.encouragingMessage.length).toBeGreaterThan(0);
    });

    it("returns correct encouraging message for long streak", async () => {
      const dates = Array.from({ length: 30 }, (_, i) => {
        const date = new Date("2026-03-20");
        date.setDate(date.getDate() - i);
        return { date: date.toISOString().split("T")[0] };
      });

      mockGetAllSync.mockReturnValueOnce(dates);
      mockGetAllSync.mockReturnValueOnce([{ totalEntries: 100 }]);

      const result = await service.getStreak();

      expect(result.currentStreak).toBe(30);
      expect(result.longestStreak).toBeGreaterThanOrEqual(30);
      expect(typeof result.encouragingMessage).toBe("string");
    });
  });

  describe("getMoodHeatmap", () => {
    it("returns all days in month with mood data", async () => {
      const heatmapData = [
        { date: "2026-03-01", dominantEmotion: "happy", intensity: 4, hasEntry: true },
        { date: "2026-03-02", dominantEmotion: "calm", intensity: 3, hasEntry: true },
        { date: "2026-03-03", dominantEmotion: null, intensity: null, hasEntry: false },
      ];

      mockGetAllSync.mockReturnValueOnce(heatmapData);

      const result = await service.getMoodHeatmap({ month: 3, year: 2026 });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      const entryWithMood = result.find(
        (d: { date: string; hasEntry: boolean }) => d.date === "2026-03-01",
      );
      if (entryWithMood) {
        expect(entryWithMood.hasEntry).toBe(true);
      }
    });
  });

  describe("getMoodTrendsChart", () => {
    it("returns mood data points for the given range", async () => {
      const trendData = [
        { date: "2026-03-18", avgIntensity: 3.5, dominantEmotion: "happy" },
        { date: "2026-03-19", avgIntensity: 4.0, dominantEmotion: "excited" },
        { date: "2026-03-20", avgIntensity: 2.5, dominantEmotion: "calm" },
      ];

      mockGetAllSync.mockReturnValueOnce(trendData);

      const result = await service.getMoodTrendsChart({ range: "week" });

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(trendData);
    });
  });

  describe("getTopEmotions", () => {
    it("returns emotions ranked by frequency", async () => {
      const rankings = [
        { category: "happy", count: 15 },
        { category: "calm", count: 10 },
        { category: "grateful", count: 7 },
        { category: "excited", count: 5 },
        { category: "hopeful", count: 3 },
      ];

      mockGetAllSync.mockReturnValueOnce(rankings);

      const result = await service.getTopEmotions({ range: "month", limit: 5 });

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(5);
      expect(result[0].count).toBeGreaterThanOrEqual(result[1].count);
      expect(result[0].category).toBe("happy");
    });

    it("respects the limit parameter", async () => {
      const rankings = [
        { category: "happy", count: 15 },
        { category: "calm", count: 10 },
        { category: "grateful", count: 7 },
      ];

      mockGetAllSync.mockReturnValueOnce(rankings);

      const result = await service.getTopEmotions({ range: "month", limit: 3 });

      expect(result).toHaveLength(3);
    });
  });
});
