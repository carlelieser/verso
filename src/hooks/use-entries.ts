import { useCallback, useEffect, useState } from 'react';

import { GUEST_USER_ID } from '@/constants/user';
import { useDatabaseContext } from '@/providers/database-provider';
import {
  createEntry as createEntryService,
  deleteEntry as deleteEntryService,
  type EntryWithEmotions,
  type EntryWithJournal,
  getEntry,
  listEntries as listEntriesService,
  searchEntries as searchEntriesService,
  updateEntry as updateEntryService,
} from '@/services/entry-service';
import type { Entry } from '@/types/entry';

interface UseEntriesResult {
  readonly entries: readonly EntryWithJournal[];
  readonly isLoading: boolean;
  readonly refresh: (journalId?: string) => Promise<void>;
  readonly createEntry: (journalId: string, html: string, text: string) => Promise<Entry>;
  readonly updateEntry: (id: string, html: string, text: string) => Promise<void>;
  readonly deleteEntry: (id: string) => Promise<void>;
  readonly loadEntry: (id: string) => Promise<EntryWithEmotions | null>;
  readonly searchEntries: (query: string) => Promise<void>;
}

export function useEntries(journalId?: string): UseEntriesResult {
  const { db } = useDatabaseContext();
  const [entries, setEntries] = useState<readonly EntryWithJournal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(
    async (filterJournalId?: string) => {
      const list = await listEntriesService(db, {
        userId: GUEST_USER_ID,
        journalId: filterJournalId ?? journalId,
      });
      setEntries(list);
      setIsLoading(false);
    },
    [db, journalId],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createEntry = useCallback(
    async (entryJournalId: string, html: string, text: string): Promise<Entry> => {
      const entry = await createEntryService(db, {
        journalId: entryJournalId,
        contentHtml: html,
        contentText: text,
      });
      return entry;
    },
    [db],
  );

  const updateEntry = useCallback(
    async (id: string, html: string, text: string): Promise<void> => {
      await updateEntryService(db, { id, contentHtml: html, contentText: text });
    },
    [db],
  );

  const deleteEntry = useCallback(
    async (id: string): Promise<void> => {
      await deleteEntryService(db, id);
      await refresh();
    },
    [db, refresh],
  );

  const loadEntry = useCallback(
    async (id: string): Promise<EntryWithEmotions | null> => {
      return getEntry(db, id);
    },
    [db],
  );

  const searchEntries = useCallback(
    async (query: string): Promise<void> => {
      if (query.trim().length === 0) {
        await refresh();
        return;
      }
      const results = await searchEntriesService(db, query);
      setEntries(results);
    },
    [db, refresh],
  );

  return {
    entries,
    isLoading,
    refresh,
    createEntry,
    updateEntry,
    deleteEntry,
    loadEntry,
    searchEntries,
  };
}
