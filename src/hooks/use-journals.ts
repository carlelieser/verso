import { useCallback, useEffect, useState } from 'react';

import { useDatabaseContext } from '@/providers/database-provider';
import {
	createJournal as createJournalService,
	deleteJournal as deleteJournalService,
	getJournalEntryCounts,
	listJournals,
	updateJournal as updateJournalService,
} from '@/services/journal-service';
import type { Journal } from '@/types/journal';

interface UseJournalsResult {
	readonly journals: readonly Journal[];
	readonly entryCounts: ReadonlyMap<string, number>;
	readonly isLoading: boolean;
	readonly error: Error | null;
	readonly refresh: () => Promise<void>;
	readonly createJournal: (name: string, icon: string) => Promise<Journal>;
	readonly updateJournal: (
		id: string,
		updates: { name?: string; icon?: string },
	) => Promise<void>;
	readonly deleteJournal: (id: string) => Promise<void>;
}

export function useJournals(): UseJournalsResult {
	const { db } = useDatabaseContext();
	const [journals, setJournals] = useState<readonly Journal[]>([]);
	const [entryCounts, setEntryCounts] = useState<ReadonlyMap<string, number>>(new Map());
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	const refresh = useCallback(async () => {
		try {
			setError(null);
			const [journalList, counts] = await Promise.all([
				listJournals(db),
				getJournalEntryCounts(db),
			]);
			setJournals(journalList);
			setEntryCounts(counts);
		} catch (err) {
			setError(err instanceof Error ? err : new Error(String(err)));
		} finally {
			setIsLoading(false);
		}
	}, [db]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const createJournal = useCallback(
		async (name: string, icon: string): Promise<Journal> => {
			const journal = await createJournalService(db, { name, icon });
			await refresh();
			return journal;
		},
		[db, refresh],
	);

	const updateJournal = useCallback(
		async (id: string, updates: { name?: string; icon?: string }): Promise<void> => {
			await updateJournalService(db, { id, ...updates });
			await refresh();
		},
		[db, refresh],
	);

	const deleteJournal = useCallback(
		async (id: string): Promise<void> => {
			await deleteJournalService(db, id);
			await refresh();
		},
		[db, refresh],
	);

	return {
		journals,
		entryCounts,
		isLoading,
		error,
		refresh,
		createJournal,
		updateJournal,
		deleteJournal,
	};
}
