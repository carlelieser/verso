import { and, desc, eq, ne } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useCallback, useMemo, useState } from 'react';

import { entries, journals } from '@/db/schema';
import { useDatabaseContext } from '@/providers/database-provider';
import {
	createEntry as createEntryService,
	deleteEntry as deleteEntryService,
	getEntry,
	searchEntries as searchEntriesService,
	updateEntry as updateEntryService,
} from '@/services/entry-service';
import type { Entry, EntryDetail, EntrySummaryWithJournal } from '@/types/entry';

const ENTRY_LIST_COLUMNS = {
	id: entries.id,
	journalId: entries.journalId,
	contentText: entries.contentText,
	createdAt: entries.createdAt,
	updatedAt: entries.updatedAt,
	journalName: journals.name,
} as const;

const NON_EMPTY = ne(entries.contentText, '');
const NOT_LOCKED = eq(journals.isLocked, false);

interface UseEntriesResult {
	readonly entries: readonly EntrySummaryWithJournal[];
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
	const [searchResults, setSearchResults] = useState<readonly EntrySummaryWithJournal[] | null>(
		null,
	);

	const { data: rows } = useLiveQuery(
		db
			.select(ENTRY_LIST_COLUMNS)
			.from(entries)
			.innerJoin(journals, eq(entries.journalId, journals.id))
			.where(
				journalId
					? and(NON_EMPTY, eq(entries.journalId, journalId))
					: and(NON_EMPTY, NOT_LOCKED),
			)
			.orderBy(desc(entries.updatedAt))
			.limit(50),
		[journalId],
	);

	const liveEntries: readonly EntrySummaryWithJournal[] = useMemo(
		() =>
			rows.map((row) => ({
				id: row.id,
				journalId: row.journalId,
				contentText: row.contentText,
				createdAt: row.createdAt.getTime(),
				updatedAt: row.updatedAt.getTime(),
				journalName: row.journalName,
			})),
		[rows],
	);

	const createEntry = useCallback(
		async (entryJournalId: string, html?: string, text?: string): Promise<Entry> => {
			return createEntryService(db, {
				journalId: entryJournalId,
				contentHtml: html ?? '',
				contentText: text ?? '',
			});
		},
		[db],
	);

	const updateEntry = useCallback(
		async (id: string, html: string, text: string, entryJournalId?: string): Promise<void> => {
			await updateEntryService(db, {
				id,
				journalId: entryJournalId,
				contentHtml: html,
				contentText: text,
			});
		},
		[db],
	);

	const deleteEntry = useCallback(
		async (id: string): Promise<void> => {
			await deleteEntryService(db, id);
		},
		[db],
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
				setSearchResults(null);
				return;
			}
			const results = await searchEntriesService(db, query, journalId);
			setSearchResults(results);
		},
		[db, journalId],
	);

	return {
		entries: searchResults ?? liveEntries,
		createEntry,
		updateEntry,
		deleteEntry,
		loadEntry,
		searchEntries,
	};
}
