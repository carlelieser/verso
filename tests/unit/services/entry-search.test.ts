import { createEntryService } from "@/services/entry-service";

const mockGetAllSync = jest.fn();
const mockSelect = jest.fn().mockReturnThis();
const mockFrom = jest.fn().mockReturnThis();
const mockWhere = jest.fn().mockReturnThis();
const mockOrderBy = jest.fn();

const mockDb = {
  select: mockSelect,
  $client: { getAllSync: mockGetAllSync },
} as unknown as Parameters<typeof createEntryService>[0];

mockSelect.mockReturnValue({ from: mockFrom });
mockFrom.mockReturnValue({ where: mockWhere });
mockWhere.mockReturnValue({ orderBy: mockOrderBy });

jest.mock("@/db/client", () => ({
  getRawClient: jest.fn(() => ({ $client: { getAllSync: mockGetAllSync } })),
}));

jest.mock("@/db/schema", () => ({
  journalEntry: { id: "id", journalId: "journalId", content: "content", createdAt: "createdAt" },
  emotionRecord: { id: "id", entryId: "entryId", category: "category", intensity: "intensity" },
  journalEntryFts: "journal_entry_fts",
}));

jest.mock("drizzle-orm", () => ({
  eq: jest.fn((...args: unknown[]) => ({ type: "eq", args })),
  and: jest.fn((...args: unknown[]) => ({ type: "and", args })),
  gte: jest.fn((...args: unknown[]) => ({ type: "gte", args })),
  lte: jest.fn((...args: unknown[]) => ({ type: "lte", args })),
  desc: jest.fn((col: unknown) => ({ type: "desc", col })),
  sql: jest.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values })),
}));

describe("EntryService - Search and Filter", () => {
  let service: ReturnType<typeof createEntryService>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = createEntryService(mockDb);
  });

  describe("search", () => {
    it("uses FTS5 MATCH query with journalId filter", async () => {
      const searchResults = [
        { id: "entry-1", content: "Today was a great day", createdAt: 1710900000 },
        { id: "entry-2", content: "Great progress on the project", createdAt: 1710800000 },
      ];

      mockGetAllSync.mockReturnValueOnce(searchResults);

      const result = await service.search("great", "journal-1");

      expect(mockGetAllSync).toHaveBeenCalled();
      expect(result).toEqual(searchResults);

      const sqlCall = mockGetAllSync.mock.calls[0];
      expect(sqlCall).toBeDefined();
    });

    it("returns empty array when no matches found", async () => {
      mockGetAllSync.mockReturnValueOnce([]);

      const result = await service.search("nonexistent", "journal-1");

      expect(result).toEqual([]);
    });
  });

  describe("filterByEmotion", () => {
    it("joins emotion_record table to filter entries", async () => {
      const filteredEntries = [
        { id: "entry-1", content: "Happy day", category: "happy" },
        { id: "entry-3", content: "Another happy day", category: "happy" },
      ];

      mockGetAllSync.mockReturnValueOnce(filteredEntries);

      const result = await service.filterByEmotion("happy", "journal-1");

      expect(mockGetAllSync).toHaveBeenCalled();
      expect(result).toEqual(filteredEntries);
    });

    it("returns empty array when no entries match the emotion", async () => {
      mockGetAllSync.mockReturnValueOnce([]);

      const result = await service.filterByEmotion("angry", "journal-1");

      expect(result).toEqual([]);
    });
  });

  describe("filterByDateRange", () => {
    it("uses Drizzle query builder with date constraints", async () => {
      const entries = [
        { id: "entry-1", content: "March entry", createdAt: 1710900000 },
        { id: "entry-2", content: "Another March entry", createdAt: 1710800000 },
      ];

      mockOrderBy.mockResolvedValueOnce(entries);

      const startDate = new Date("2026-03-01");
      const endDate = new Date("2026-03-31");

      const result = await service.filterByDateRange(startDate, endDate, "journal-1");

      expect(mockSelect).toHaveBeenCalled();
      expect(result).toEqual(entries);
    });

    it("returns empty array when no entries in date range", async () => {
      mockOrderBy.mockResolvedValueOnce([]);

      const startDate = new Date("2025-01-01");
      const endDate = new Date("2025-01-31");

      const result = await service.filterByDateRange(startDate, endDate, "journal-1");

      expect(result).toEqual([]);
    });
  });
});
