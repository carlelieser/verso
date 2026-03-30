import React, {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';

import {useSettings} from '@/hooks/use-settings';
import {useDatabaseContext} from '@/providers/database-provider';
import {
	createEntry as createEntryService,
	deleteEntry as deleteEntryService,
	getEntry,
} from '@/services/entry-service';
import {listJournals} from '@/services/journal-service';
import {captureLocationAndWeather} from '@/services/location-weather-service';
import {getErrorMessage} from '@/utils/error';

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
	const {db} = useDatabaseContext();
	const {isAutoLocation} = useSettings();

	const [currentEntryId, setCurrentEntryId] = useState<string | null>(existingEntryId ?? null);
	const isCreatingRef = useRef(false);

	const resolveJournalId = useCallback(async (): Promise<string | null> => {
		if (initialJournalId) return initialJournalId;
		const journals = await listJournals(db);
		return journals[0]?.id ?? null;
	}, [initialJournalId, db]);

	// Create mode: create an entry on mount
	useEffect(() => {
		if (isEditMode || currentEntryId || isCreatingRef.current) return;

		isCreatingRef.current = true;
		resolveJournalId()
			.then(async (journalId) => {
				if (!journalId) return;
				const entry = await createEntryService(db, {
					journalId,
					contentHtml: '',
					contentText: '',
				});
				setCurrentEntryId(entry.id);
				if (isAutoLocation) {
					captureLocationAndWeather(db, entry.id).catch((err: unknown) => {
						console.warn('Silent failure:', getErrorMessage(err));
					});
				}
			})
			.finally(() => {
				isCreatingRef.current = false;
			});
	}, [isEditMode, currentEntryId, resolveJournalId, isAutoLocation, db]);

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
				const database = dbRef.current;
				getEntry(database, id)
					.then((entry) => {
						const hasContent = entry.contentText.trim().length > 0;
						const hasAttachments = entry.attachments.length > 0;
						const hasEmotions = entry.emotions.length > 0;

						if (!hasContent && !hasAttachments && !hasEmotions) {
							deleteEntryService(database, id).catch((err: unknown) => {
								console.warn('Silent failure:', getErrorMessage(err));
							});
						}
					})
					.catch((err: unknown) => {
						console.warn('Silent failure:', getErrorMessage(err));
					});
			}, 100);
		};
	}, [isEditMode]);

	const cycle = useCallback(async () => {
		const journalId = await resolveJournalId();
		if (!journalId) return;

		const entry = await createEntryService(db, {
			journalId,
			contentHtml: '',
			contentText: '',
		});
		setCurrentEntryId(entry.id);

		if (isAutoLocation) {
			captureLocationAndWeather(db, entry.id).catch((err: unknown) => {
				console.warn('Silent failure:', getErrorMessage(err));
			});
		}
	}, [resolveJournalId, isAutoLocation, db]);

	const contextValue = useMemo(
		() => currentEntryId ? {entryId: currentEntryId, isEditMode, cycle} : null,
		[currentEntryId, isEditMode, cycle],
	);

	if (!contextValue) return null;

	return (
		<EntryContext.Provider value={contextValue}>
			{children}
		</EntryContext.Provider>
	);
}
