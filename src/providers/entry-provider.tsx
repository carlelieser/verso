import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';

import type { EditorHandle } from '@/components/entry/editor';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useJournals } from '@/hooks/use-journals';
import { useSettings } from '@/hooks/use-settings';
import { useDatabaseContext } from '@/providers/database-provider';
import {
	getEmotions,
	saveEmotions as saveEmotionsService,
} from '@/services/emotion-service';
import {
	createEntry as createEntryService,
	deleteEntry as deleteEntryService,
	getEntry,
	updateEntry as updateEntryService,
} from '@/services/entry-service';
import { captureLocationAndWeather } from '@/services/location-weather-service';
import type { EmotionSelection } from '@/types/emotion';
import type { Journal } from '@/types/journal';
import { getErrorMessage } from '@/utils/error';

interface EntryContextValue {
	// Identity
	readonly entryId: string;
	readonly isEditMode: boolean;
	readonly isLoading: boolean;

	// Journal
	readonly journalId: string | null;
	readonly journals: readonly Journal[];
	readonly setJournalId: (id: string | null) => void;
	readonly createJournal: (name: string, icon: string, color: string) => Promise<void>;

	// Content (refs for perf — no re-renders on keystrokes)
	readonly contentHtmlRef: React.MutableRefObject<string>;
	readonly contentTextRef: React.MutableRefObject<string>;
	readonly hasContent: boolean;
	readonly setContent: (html: string, text: string) => void;
	readonly updateHtml: (html: string) => void;

	// Emotions
	readonly emotions: readonly EmotionSelection[];
	readonly setEmotions: (selections: readonly EmotionSelection[]) => void;

	// Editor
	readonly editorRef: React.RefObject<EditorHandle | null>;

	// Actions
	readonly save: () => void;
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
	const { isAutoLocation } = useSettings();
	const { journals, createJournal: createJournalService } = useJournals();

	// --- Entry ID lifecycle ---

	const [currentEntryId, setCurrentEntryId] = useState<string | null>(existingEntryId ?? null);
	const isCreatingRef = useRef(false);

	const defaultJournalId = initialJournalId ?? journals[0]?.id ?? null;

	const resolveJournalId = useCallback((): string | null => {
		if (initialJournalId) return initialJournalId;
		return journals[0]?.id ?? null;
	}, [initialJournalId, journals]);

	// Create mode: create an entry on mount
	useEffect(() => {
		if (isEditMode || currentEntryId || isCreatingRef.current) return;

		isCreatingRef.current = true;
		const journalId = resolveJournalId();
		if (!journalId) {
			isCreatingRef.current = false;
			return;
		}

		createEntryService(db, {
			journalId,
			contentHtml: '',
			contentText: '',
		})
			.then((entry) => {
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
	const currentEntryIdRef = useRef(currentEntryId);
	const dbRef = useRef(db);
	const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	currentEntryIdRef.current = currentEntryId;
	dbRef.current = db;

	useEffect(() => {
		if (isEditMode) return;

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
						const hasEntryContent = entry.contentText.trim().length > 0;
						const hasAttachments = entry.attachments.length > 0;
						const hasEmotions = entry.emotions.length > 0;

						if (!hasEntryContent && !hasAttachments && !hasEmotions) {
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

	// --- Journal state ---

	const [explicitJournalId, setExplicitJournalId] = useState<string | null>(null);
	const journalId = explicitJournalId ?? defaultJournalId;

	const createJournal = useCallback(
		async (name: string, icon: string, color: string) => {
			const journal = await createJournalService(name, icon, color);
			setExplicitJournalId(journal.id);
		},
		[createJournalService],
	);

	// --- Content state (refs for perf) ---

	const contentHtmlRef = useRef('');
	const contentTextRef = useRef('');
	const editorRef = useRef<EditorHandle>(null);
	const [hasContent, setHasContent] = useState(isEditMode);

	const { markDirty } = useAutoSave(currentEntryId, {
		html: contentHtmlRef,
		text: contentTextRef,
	});

	const setContent = useCallback(
		(html: string, text: string) => {
			contentHtmlRef.current = html;
			contentTextRef.current = text;
			markDirty();

			const hasText = text.trim().length > 0;
			setHasContent(hasText);

			// Lock journal on first content
			if (hasText && explicitJournalId === null) {
				setExplicitJournalId(defaultJournalId);
			}
		},
		[markDirty, explicitJournalId, defaultJournalId],
	);

	const updateHtml = useCallback(
		(html: string) => {
			contentHtmlRef.current = html;
			markDirty();
		},
		[markDirty],
	);

	// --- Emotion state ---

	const [emotions, setEmotions] = useState<readonly EmotionSelection[]>([]);

	const handleSetEmotions = useCallback(
		(selections: readonly EmotionSelection[]) => {
			setEmotions(selections);

			// Lock journal when emotions are set
			if (selections.length > 0 && explicitJournalId === null) {
				setExplicitJournalId(defaultJournalId);
			}
		},
		[explicitJournalId, defaultJournalId],
	);

	// --- Edit mode loading ---

	const [isLoading, setIsLoading] = useState(isEditMode);

	useEffect(() => {
		if (!isEditMode || !currentEntryId) return;

		let isActive = true;

		Promise.all([getEntry(db, currentEntryId), getEmotions(db, currentEntryId)])
			.then(([entry, emotionRecords]) => {
				if (!isActive) return;

				setExplicitJournalId(entry.journalId);
				contentHtmlRef.current = entry.contentHtml;
				contentTextRef.current = entry.contentText;

				if (emotionRecords.length > 0) {
					setEmotions(
						emotionRecords.map((e) => ({
							emotion: e.category,
							intensity: e.intensity,
						})),
					);
				}

				setIsLoading(false);
			})
			.catch((err: unknown) => {
				console.error('Failed to load entry:', getErrorMessage(err));
				if (isActive) {
					setIsLoading(false);
				}
			});

		return () => {
			isActive = false;
		};
	}, [isEditMode, currentEntryId, db]);

	// --- Actions ---

	const save = useCallback(() => {
		if (!currentEntryId) return;

		const saves: Promise<void>[] = [
			updateEntryService(db, {
				id: currentEntryId,
				journalId: journalId ?? undefined,
				contentHtml: contentHtmlRef.current,
				contentText: contentTextRef.current,
			}),
		];

		if (emotions.length > 0) {
			saves.push(
				saveEmotionsService(
					db,
					currentEntryId,
					emotions.map((s) => ({
						category: s.emotion,
						intensity: s.intensity,
					})),
				),
			);
		}

		Promise.all(saves).catch((err: unknown) => {
			console.error('Save failed:', getErrorMessage(err));
		});
	}, [currentEntryId, journalId, emotions, db]);

	const cycle = useCallback(async () => {
		const nextJournalId = resolveJournalId();
		if (!nextJournalId) return;

		// Reset all state atomically
		editorRef.current?.clear();
		setHasContent(false);
		setExplicitJournalId(null);
		contentHtmlRef.current = '';
		contentTextRef.current = '';
		setEmotions([]);

		const entry = await createEntryService(db, {
			journalId: nextJournalId,
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

	// --- Context value ---

	const contextValue = useMemo(
		(): EntryContextValue | null =>
			currentEntryId
				? {
						entryId: currentEntryId,
						isEditMode,
						isLoading,
						journalId,
						journals,
						setJournalId: setExplicitJournalId,
						createJournal,
						contentHtmlRef,
						contentTextRef,
						hasContent,
						setContent,
						updateHtml,
						emotions,
						setEmotions: handleSetEmotions,
						editorRef,
						save,
						cycle,
					}
				: null,
		[
			currentEntryId,
			isEditMode,
			isLoading,
			journalId,
			journals,
			createJournal,
			hasContent,
			setContent,
			updateHtml,
			emotions,
			handleSetEmotions,
			save,
			cycle,
		],
	);

	if (!contextValue) return null;

	return <EntryContext.Provider value={contextValue}>{children}</EntryContext.Provider>;
}
