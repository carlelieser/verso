import { useCallback, useEffect, useMemo, useState } from 'react';

import { useDatabaseContext } from '@/providers/database-provider';
import { createJournalService } from '@/services/journal-service';
import type { Journal } from '@/types/journal';

const GUEST_USER_ID = 'guest';

interface UseJournalsResult {
  readonly journals: readonly Journal[];
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly createJournal: (name: string) => Promise<Journal>;
  readonly renameJournal: (id: string, name: string) => Promise<void>;
  readonly reorderJournals: (orderedIds: readonly string[]) => Promise<void>;
  readonly deleteJournal: (id: string) => Promise<void>;
  readonly refresh: () => Promise<void>;
}

export function useJournals(): UseJournalsResult {
  const { db } = useDatabaseContext();
  const service = useMemo(() => createJournalService(db), [db]);

  const [journals, setJournals] = useState<readonly Journal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadJournals = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await service.getAll(GUEST_USER_ID);
      setJournals(result);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  useEffect(() => {
    loadJournals();
  }, [loadJournals]);

  const createJournal = useCallback(
    async (name: string): Promise<Journal> => {
      const journal = await service.create({ name, userId: GUEST_USER_ID });
      setJournals((prev) => [...prev, journal]);
      return journal;
    },
    [service],
  );

  const renameJournal = useCallback(
    async (id: string, name: string): Promise<void> => {
      await service.rename(id, name);
      setJournals((prev) =>
        prev.map((j) => (j.id === id ? { ...j, name, updatedAt: Date.now() } : j)),
      );
    },
    [service],
  );

  const reorderJournals = useCallback(
    async (orderedIds: readonly string[]): Promise<void> => {
      setJournals((prev) => {
        const map = new Map(prev.map((j) => [j.id, j]));
        return orderedIds
          .map((id, index) => {
            const journal = map.get(id);
            return journal ? { ...journal, displayOrder: index } : undefined;
          })
          .filter((j): j is Journal => j !== undefined);
      });

      await service.reorder(orderedIds);
    },
    [service],
  );

  const deleteJournal = useCallback(
    async (id: string): Promise<void> => {
      await service.delete(id);
      setJournals((prev) => prev.filter((j) => j.id !== id));
    },
    [service],
  );

  return {
    journals,
    isLoading,
    error,
    createJournal,
    renameJournal,
    reorderJournals,
    deleteJournal,
    refresh: loadJournals,
  };
}
