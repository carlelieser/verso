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
	toEntry,
	updateEntry as updateEntryService,
} from '@/services/entry-service';
import type { Entry, EntryDetail, EntryWithJournal } from '@/types/entry';

const ENTRY_COLUMNS = {
	id: entries.id,
	journalId: entries.journalId,
	contentHtml: entries.contentHtml,
	contentText: entries.contentText,
	createdAt: entries.createdAt,
	updatedAt: entries.updatedAt,
	journalName: journals.name,
} as const;

const NON_EMPTY = ne(entries.contentText, '');

interface UseEntriesResult {
	readonly entries: readonly EntryWithJournal[];
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
	const [searchResults, setSearchResults] = useState<readonly EntryWithJournal[] | null>(null);

	const { data: rows } = useLiveQuery(
		db
			.select(ENTRY_COLUMNS)
			.from(entries)
			.innerJoin(journals, eq(entries.journalId, journals.id))
			.where(journalId ? and(NON_EMPTY, eq(entries.journalId, journalId)) : NON_EMPTY)
			.orderBy(desc(entries.updatedAt))
			.limit(50),
		[journalId],
	);

	const liveEntries: readonly EntryWithJournal[] = useMemo(
		() =>
			rows.map((row) => ({
				...toEntry(row),
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
			const results = await searchEntriesService(db, query);
			setSearchResults(results);
		},
		[db],
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
