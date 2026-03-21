import { useCallback, useEffect, useMemo, useState } from 'react';

import { useDatabaseContext } from '@/providers/database-provider';
import { createEntryService } from '@/services/entry-service';
import type { Entry } from '@/types/entry';

interface UseEntriesResult {
  readonly entries: readonly Entry[];
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly hasMore: boolean;
  readonly createEntry: (journalId: string) => Promise<Entry>;
  readonly deleteEntry: (id: string) => Promise<void>;
  readonly loadMore: () => Promise<void>;
  readonly refresh: () => Promise<void>;
}

const PAGE_SIZE = 20;

export function useEntries(journalId: string | null): UseEntriesResult {
  const { db } = useDatabaseContext();
  const service = useMemo(() => createEntryService(db), [db]);

  const [entries, setEntries] = useState<readonly Entry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const loadEntries = useCallback(
    async (reset = false) => {
      if (!journalId) return;

      try {
        setIsLoading(true);
        const currentOffset = reset ? 0 : offset;
        const result = await service.getByJournal(journalId, {
          limit: PAGE_SIZE,
          offset: currentOffset,
        });

        if (reset) {
          setEntries(result);
          setOffset(result.length);
        } else {
          setEntries((prev) => [...prev, ...result]);
          setOffset(currentOffset + result.length);
        }

        setHasMore(result.length === PAGE_SIZE);
        setError(null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    },
    [journalId, offset, service],
  );

  useEffect(() => {
    if (journalId) {
      loadEntries(true);
    }
    // Only reload when journalId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journalId]);

  const createEntry = useCallback(
    async (jId: string): Promise<Entry> => {
      const entry = await service.create({ journalId: jId });
      setEntries((prev) => [entry, ...prev]);
      return entry;
    },
    [service],
  );

  const deleteEntry = useCallback(
    async (id: string): Promise<void> => {
      await service.delete(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    },
    [service],
  );

  const loadMore = useCallback(async () => {
    if (!isLoading && hasMore) {
      await loadEntries(false);
    }
  }, [isLoading, hasMore, loadEntries]);

  const refresh = useCallback(async () => {
    await loadEntries(true);
  }, [loadEntries]);

  return {
    entries,
    isLoading,
    error,
    hasMore,
    createEntry,
    deleteEntry,
    loadMore,
    refresh,
  };
}
