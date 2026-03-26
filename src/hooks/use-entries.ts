import { useCallback, useEffect, useState } from 'react';

import { useDatabaseContext } from '@/providers/database-provider';
import {
	createEntry as createEntryService,
	deleteEntry as deleteEntryService,
	getEntry,
	listEntries as listEntriesService,
	searchEntries as searchEntriesService,
	updateEntry as updateEntryService,
} from '@/services/entry-service';
import type { Entry, EntryDetail, EntryWithJournal } from '@/types/entry';

interface UseEntriesResult {
	readonly entries: readonly EntryWithJournal[];
	readonly isLoading: boolean;
	readonly error: Error | null;
	readonly refresh: (journalId?: string) => Promise<void>;
	readonly createEntry: (journalId: string, html?: string, text?: string) => Promise<Entry>;
	readonly updateEntry: (
		id: string,
		html: string,
		text: string,
		journalId?: string,
	) => Promise<void>;
	readonly deleteEntry: (id: string) => Promise<void>;
	readonly loadEntry: (id: string) => Promise<EntryDetail>;
	readonly searchEntries: (query: string) => Promise<void>;
}

export function useEntries(journalId?: string): UseEntriesResult {
	const { db } = useDatabaseContext();
	const [entries, setEntries] = useState<readonly EntryWithJournal[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	const refresh = useCallback(
		async (filterJournalId?: string) => {
			try {
				setError(null);
				const list = await listEntriesService(db, {
					journalId: filterJournalId ?? journalId,
				});
				setEntries(list);
			} catch (err) {
				setError(err instanceof Error ? err : new Error(String(err)));
			} finally {
				setIsLoading(false);
			}
		},
		[db, journalId],
	);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const createEntry = useCallback(
		async (entryJournalId: string, html?: string, text?: string): Promise<Entry> => {
			const entry = await createEntryService(db, {
				journalId: entryJournalId,
				contentHtml: html ?? '',
				contentText: text ?? '',
			});
			return entry;
		},
		[db],
	);

	const updateEntry = useCallback(
		async (id: string, html: string, text: string, journalId?: string): Promise<void> => {
			await updateEntryService(db, { id, journalId, contentHtml: html, contentText: text });
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
		async (id: string): Promise<EntryDetail> => {
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
		error,
		refresh,
		createEntry,
		updateEntry,
		deleteEntry,
		loadEntry,
		searchEntries,
	};
}
