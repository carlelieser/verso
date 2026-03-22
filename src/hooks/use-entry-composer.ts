import { useCallback, useEffect, useRef, useState } from 'react';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import type { EditorHandle } from '@/components/editor';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useEmotions } from '@/hooks/use-emotions';
import { useEntries } from '@/hooks/use-entries';
import { useJournals } from '@/hooks/use-journals';
import type { EmotionCategory, EmotionIntensity } from '@/types/common';
import type { Journal } from '@/types/journal';

interface EmotionSelection {
	readonly emotion: EmotionCategory;
	readonly intensity: EmotionIntensity;
}

interface UseEntryComposerOptions {
	/** Existing entry ID when editing. Null for new entries. */
	readonly entryId?: string | null;
	/** Pre-select a journal by ID in create mode. */
	readonly initialJournalId?: string | null;
	/** Called after the entry is successfully saved. */
	readonly onFinish?: (entryId: string) => void;
	/** Whether the check button animates in/out with content (default: false). */
	readonly isAnimatedCheck?: boolean;
}

interface UseEntryComposerResult {
	readonly selectedJournalId: string | null;
	readonly setSelectedJournalId: (id: string | null) => void;
	readonly currentEntryId: string | null;
	readonly hasContent: boolean;
	readonly isLoading: boolean;
	readonly defaultHtml: string;
	readonly defaultEmotions: readonly EmotionSelection[];
	readonly editorRef: React.RefObject<EditorHandle | null>;
	readonly htmlRef: React.MutableRefObject<string>;
	readonly checkButtonStyle: {
		readonly width: number;
		readonly opacity: number;
		readonly paddingRight: number;
		readonly overflow: 'hidden';
	};
	readonly journals: readonly Journal[];
	readonly isEditMode: boolean;
	readonly handleTextChange: (text: string, html: string) => Promise<void>;
	readonly handleHtmlChange: (html: string) => void;
	readonly handleEmotionSave: (selections: readonly EmotionSelection[]) => void;
	readonly handleFinish: () => Promise<void>;
	readonly handleCreateJournal: (name: string, icon: string) => Promise<void>;
	readonly handleClear: () => void;
}

export function useEntryComposer(options?: UseEntryComposerOptions): UseEntryComposerResult {
	const initialEntryId = options?.entryId ?? null;
	const initialJournalId = options?.initialJournalId ?? null;
	const onFinish = options?.onFinish;
	const isAnimatedCheck = options?.isAnimatedCheck ?? false;

	const { createEntry, deleteEntry, updateEntry, loadEntry } = useEntries();
	const { saveEmotions, getEmotions } = useEmotions();
	const { journals, createJournal } = useJournals();

	const isEditMode = initialEntryId !== null;

	const [selectedJournalId, setSelectedJournalId] = useState<string | null>(initialJournalId);
	const [currentEntryId, setCurrentEntryId] = useState<string | null>(initialEntryId);
	const [hasContent, setHasContent] = useState(isEditMode);
	const [isLoading, setIsLoading] = useState(isEditMode);
	const [defaultHtml, setDefaultHtml] = useState('');
	const [defaultEmotions, setDefaultEmotions] = useState<readonly EmotionSelection[]>([]);
	const [autoSaveContent, setAutoSaveContent] = useState({ html: '', text: '' });

	const editorRef = useRef<EditorHandle>(null);
	const emotionSelectionsRef = useRef<EmotionSelection[]>([]);
	const htmlRef = useRef('');
	const textRef = useRef('');
	const isCreatingRef = useRef(false);

	const checkWidth = useSharedValue(isEditMode ? 48 : 0);
	const checkOpacity = useSharedValue(isEditMode ? 1 : 0);

	const checkButtonStyle = useAnimatedStyle(() => ({
		width: checkWidth.value,
		opacity: checkOpacity.value,
		paddingRight: 12,
		overflow: 'hidden' as const,
	}));

	// Default to first journal in create mode
	useEffect(() => {
		if (!isEditMode && journals.length > 0 && !selectedJournalId) {
			setSelectedJournalId(journals[0]?.id ?? null);
		}
	}, [isEditMode, journals, selectedJournalId]);

	// Load existing entry + emotions in edit mode
	useEffect(() => {
		if (!initialEntryId) return;

		let isActive = true;

		Promise.all([loadEntry(initialEntryId), getEmotions(initialEntryId)])
			.then(([entry, emotions]) => {
				if (!isActive) return;

				if (entry) {
					setSelectedJournalId(entry.journalId);
					setDefaultHtml(entry.contentHtml);
					htmlRef.current = entry.contentHtml;
					textRef.current = entry.contentText;
					setAutoSaveContent({ html: entry.contentHtml, text: entry.contentText });
				}
				if (emotions.length > 0) {
					const mapped = emotions.map((e) => ({
						emotion: e.category,
						intensity: e.intensity,
					}));
					emotionSelectionsRef.current = mapped;
					setDefaultEmotions(mapped);
				}
				setIsLoading(false);
			})
			.catch(() => {
				if (isActive) {
					setIsLoading(false);
				}
			});

		return () => {
			isActive = false;
		};
	}, [initialEntryId, loadEntry, getEmotions]);

	useAutoSave(currentEntryId, autoSaveContent);

	const handleTextChange = useCallback(
		async (text: string, html: string) => {
			const hasText = text.trim().length > 0;
			htmlRef.current = html;
			textRef.current = text;

			if (!isEditMode) {
				if (hasText && !currentEntryId && selectedJournalId && !isCreatingRef.current) {
					isCreatingRef.current = true;
					const entry = await createEntry(selectedJournalId, html, text);
					setCurrentEntryId(entry.id);
					isCreatingRef.current = false;
				} else if (!hasText && currentEntryId) {
					await deleteEntry(currentEntryId);
					setCurrentEntryId(null);
				}
			}

			if (currentEntryId) {
				setAutoSaveContent({ html, text });
			}

			setHasContent(hasText);
			if (isAnimatedCheck) {
				checkWidth.value = withSpring(hasText ? 48 : 0);
				checkOpacity.value = withSpring(hasText ? 1 : 0);
			}
		},
		[isEditMode, isAnimatedCheck, currentEntryId, selectedJournalId, createEntry, deleteEntry, checkWidth, checkOpacity],
	);

	const handleHtmlChange = useCallback(
		(html: string) => {
			htmlRef.current = html;
			if (currentEntryId) {
				setAutoSaveContent({ html, text: textRef.current });
			}
		},
		[currentEntryId],
	);

	const handleEmotionSave = useCallback(
		(selections: readonly EmotionSelection[]) => {
			emotionSelectionsRef.current = [...selections];
			setDefaultEmotions([...selections]);
		},
		[],
	);

	const handleFinish = useCallback(async () => {
		const entryId = currentEntryId;
		if (!entryId) return;

		await updateEntry(entryId, htmlRef.current, textRef.current, selectedJournalId ?? undefined);

		if (emotionSelectionsRef.current.length > 0) {
			await saveEmotions(
				entryId,
				emotionSelectionsRef.current.map((s) => ({
					category: s.emotion,
					intensity: s.intensity,
				})),
			);
		}

		onFinish?.(entryId);
	}, [currentEntryId, selectedJournalId, updateEntry, saveEmotions, onFinish]);

	const handleCreateJournal = useCallback(
		async (name: string, icon: string) => {
			const journal = await createJournal(name, icon);
			setSelectedJournalId(journal.id);
		},
		[createJournal],
	);

	const handleClear = useCallback(() => {
		editorRef.current?.clear();
		setCurrentEntryId(null);
		setHasContent(false);
		setAutoSaveContent({ html: '', text: '' });
		htmlRef.current = '';
		textRef.current = '';
		emotionSelectionsRef.current = [];
		setDefaultEmotions([]);
		checkWidth.value = withSpring(0);
		checkOpacity.value = withSpring(0);
	}, [checkWidth, checkOpacity]);

	return {
		selectedJournalId,
		setSelectedJournalId,
		currentEntryId,
		hasContent,
		isLoading,
		defaultHtml,
		defaultEmotions,
		editorRef,
		htmlRef,
		checkButtonStyle,
		journals,
		isEditMode,
		handleTextChange,
		handleHtmlChange,
		handleEmotionSave,
		handleFinish,
		handleCreateJournal,
		handleClear,
	};
}
