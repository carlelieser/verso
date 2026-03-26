import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { useEntries } from '@/hooks/use-entries';
import { useJournals } from '@/hooks/use-journals';
import { useSettings } from '@/hooks/use-settings';
import { useDatabaseContext } from '@/providers/database-provider';
import { getEntry } from '@/services/entry-service';
import { captureLocationAndWeather } from '@/services/location-weather-service';

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
	const { db } = useDatabaseContext();
	const { createEntry, deleteEntry } = useEntries();
	const { journals } = useJournals();
	const { isAutoLocation } = useSettings();

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
				if (isAutoLocation) {
					captureLocationAndWeather(db, entry.id).catch(() => {});
				}
			})
			.finally(() => {
				isCreatingRef.current = false;
			});
	}, [isEditMode, currentEntryId, resolveJournalId, createEntry, isAutoLocation, db]);

	// Cleanup on unmount: delete entry only if it has no meaningful content.
	// Deferred to avoid deleting during React strict mode's immediate
	// teardown-and-remount cycle in development.
	const currentEntryIdRef = useRef(currentEntryId);
	const dbRef = useRef(db);
	const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	currentEntryIdRef.current = currentEntryId;
	dbRef.current = db;

	useEffect(() => {
		if (isEditMode) return;

		// Cancel any pending cleanup from a previous unmount (strict mode remount)
		if (cleanupTimerRef.current) {
			clearTimeout(cleanupTimerRef.current);
			cleanupTimerRef.current = null;
		}

		return () => {
			const id = currentEntryIdRef.current;
			if (!id) return;

			cleanupTimerRef.current = setTimeout(() => {
				getEntry(dbRef.current, id)
					.then((entry) => {
						const hasContent = entry.contentText.trim().length > 0;
						const hasAttachments = entry.attachments.length > 0;
						const hasEmotions = entry.emotions.length > 0;

						if (!hasContent && !hasAttachments && !hasEmotions) {
							deleteEntry(id).catch(() => {});
						}
					})
					.catch(() => {});
			}, 100);
		};
	}, [isEditMode, deleteEntry]);

	const cycle = useCallback(async () => {
		const journalId = resolveJournalId();
		if (!journalId) return;

		// Create the new entry before swapping IDs so children never see null
		const entry = await createEntry(journalId, '', '');
		setCurrentEntryId(entry.id);

		if (isAutoLocation) {
			captureLocationAndWeather(db, entry.id).catch(() => {});
		}
	}, [resolveJournalId, createEntry, isAutoLocation, db]);

	if (!currentEntryId) return null;

	return (
		<EntryContext.Provider value={{ entryId: currentEntryId, isEditMode, cycle }}>
			{children}
		</EntryContext.Provider>
	);
}
