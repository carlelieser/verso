import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { useEntries } from '@/hooks/use-entries';
import { useJournals } from '@/hooks/use-journals';

interface EntryContextValue {
	readonly entryId: string;
	readonly isEditMode: boolean;
	/** Delete the current entry and create a fresh one. Used after save on home screen. */
	readonly cycle: () => Promise<void>;
}

const EntryContext = createContext<EntryContextValue | null>(null);

export function useEntryContext(): EntryContextValue {
	const context = useContext(EntryContext);
	if (!context) {
		throw new Error('useEntryContext must be used within an EntryProvider');
	}
	return context;
}

interface EntryProviderProps {
	/** Pass an existing entry ID for edit mode. Omit for create mode. */
	readonly entryId?: string | null;
	/** Journal ID to use when creating a new entry. */
	readonly journalId?: string | null;
	readonly children: React.ReactNode;
}

export function EntryProvider({
	entryId: existingEntryId,
	journalId: initialJournalId,
	children,
}: EntryProviderProps): React.JSX.Element | null {
	const isEditMode = existingEntryId !== null && existingEntryId !== undefined;
	const { createEntry, deleteEntry } = useEntries();
	const { journals } = useJournals();

	const [currentEntryId, setCurrentEntryId] = useState<string | null>(existingEntryId ?? null);
	const isCreatingRef = useRef(false);

	const resolveJournalId = useCallback((): string | null => {
		if (initialJournalId) return initialJournalId;
		return journals[0]?.id ?? null;
	}, [initialJournalId, journals]);

	// Create mode: create an entry on mount
	useEffect(() => {
		if (isEditMode || currentEntryId || isCreatingRef.current) return;

		const journalId = resolveJournalId();
		if (!journalId) return;

		isCreatingRef.current = true;
		createEntry(journalId, '', '')
			.then((entry) => {
				setCurrentEntryId(entry.id);
			})
			.finally(() => {
				isCreatingRef.current = false;
			});
	}, [isEditMode, currentEntryId, resolveJournalId, createEntry]);

	// Cleanup on unmount: delete empty entries
	const currentEntryIdRef = useRef(currentEntryId);
	currentEntryIdRef.current = currentEntryId;

	useEffect(() => {
		if (isEditMode) return;

		return () => {
			const id = currentEntryIdRef.current;
			if (id) {
				// Fire-and-forget cleanup — if the entry has content, the
				// listEntries query already filters out empty entries.
				// This just cleans up the DB row.
				deleteEntry(id).catch(() => {});
			}
		};
	}, [isEditMode, deleteEntry]);

	const cycle = useCallback(async () => {
		const oldId = currentEntryId;
		setCurrentEntryId(null);

		if (oldId) {
			await deleteEntry(oldId).catch(() => {});
		}

		const journalId = resolveJournalId();
		if (!journalId) return;

		const entry = await createEntry(journalId, '', '');
		setCurrentEntryId(entry.id);
	}, [currentEntryId, resolveJournalId, createEntry, deleteEntry]);

	if (!currentEntryId) return null;

	return (
		<EntryContext.Provider value={{ entryId: currentEntryId, isEditMode, cycle }}>
			{children}
		</EntryContext.Provider>
	);
}
