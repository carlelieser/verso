import { and, asc, count, eq, ne } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useCallback, useMemo } from 'react';

import { entries, journals } from '@/db/schema';
import { useDatabaseContext } from '@/providers/database-provider';
import {
	createJournal as createJournalService,
	deleteJournal as deleteJournalService,
	setDefaultJournal as setDefaultJournalService,
	toJournal,
	updateJournal as updateJournalService,
} from '@/services/journal-service';
import type { Journal } from '@/types/journal';

interface UseJournalsResult {
	readonly journals: readonly Journal[];
	readonly entryCounts: ReadonlyMap<string, number>;
	readonly createJournal: (name: string, icon: string, color: string) => Promise<Journal>;
	readonly updateJournal: (
		id: string,
		updates: { name?: string; icon?: string; color?: string },
	) => Promise<void>;
	readonly setDefaultJournal: (id: string) => Promise<void>;
	readonly deleteJournal: (id: string) => Promise<void>;
}

export function useJournals(): UseJournalsResult {
	const { db } = useDatabaseContext();

	const { data: journalRows } = useLiveQuery(
		db.select().from(journals).orderBy(asc(journals.displayOrder)),
	);

	const { data: countRows } = useLiveQuery(
		db
			.select({
				journalId: entries.journalId,
				count: count(),
			})
			.from(entries)
			.innerJoin(journals, eq(journals.id, entries.journalId))
			.where(and(ne(entries.contentText, ''), eq(journals.isLocked, false)))
			.groupBy(entries.journalId),
	);

	const mappedJournals: readonly Journal[] = useMemo(
		() => journalRows.map(toJournal),
		[journalRows],
	);

	const entryCounts: ReadonlyMap<string, number> = useMemo(
		() => new Map(countRows.map((row) => [row.journalId, row.count])),
		[countRows],
	);

	const createJournal = useCallback(
		async (name: string, icon: string, color: string): Promise<Journal> => {
			return createJournalService(db, { name, icon, color });
		},
		[db],
	);

	const updateJournal = useCallback(
		async (
			id: string,
			updates: { name?: string; icon?: string; color?: string },
		): Promise<void> => {
			await updateJournalService(db, { id, ...updates });
		},
		[db],
	);

	const setDefaultJournal = useCallback(
		async (id: string): Promise<void> => {
			await setDefaultJournalService(db, id);
		},
		[db],
	);

	const deleteJournal = useCallback(
		async (id: string): Promise<void> => {
			await deleteJournalService(db, id);
		},
		[db],
	);

	return {
		journals: mappedJournals,
		entryCounts,
		createJournal,
		updateJournal,
		setDefaultJournal,
		deleteJournal,
	};
}
