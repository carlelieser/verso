import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import type { ViewStyle } from 'react-native';
import type { AnimatedStyle } from 'react-native-reanimated';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import type { EditorHandle } from '@/components/editor';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useEmotions } from '@/hooks/use-emotions';
import { useEntries } from '@/hooks/use-entries';
import { useJournals } from '@/hooks/use-journals';
import { useEntryContext } from '@/providers/entry-provider';
import type { EmotionSelection } from '@/types/emotion';
import type { Journal } from '@/types/journal';

interface UseEntryComposerOptions {
	/** Called after the entry is successfully saved. */
	readonly onFinish?: (entryId: string) => void;
	/** Whether the check button animates in/out with content (default: false). */
	readonly isAnimatedCheck?: boolean;
}

interface UseEntryComposerResult {
	readonly selectedJournalId: string | null;
	readonly setSelectedJournalId: (id: string | null) => void;
	readonly entryId: string;
	readonly hasContent: boolean;
	readonly isLoading: boolean;
	readonly defaultHtml: string;
	readonly defaultEmotions: readonly EmotionSelection[];
	readonly editorRef: React.RefObject<EditorHandle | null>;
	readonly htmlRef: React.MutableRefObject<string>;
	readonly checkButtonStyle: AnimatedStyle<ViewStyle>;
	readonly journals: readonly Journal[];
	readonly isEditMode: boolean;
	readonly handleTextChange: (text: string, html: string) => void;
	readonly handleHtmlChange: (html: string) => void;
	readonly handleEmotionSave: (selections: readonly EmotionSelection[]) => void;
	readonly handleFinish: () => void;
	readonly handleCreateJournal: (name: string, icon: string) => Promise<void>;
	readonly handleClear: () => void;
}

export function useEntryComposer(options?: UseEntryComposerOptions): UseEntryComposerResult {
	const onFinish = options?.onFinish;
	const isAnimatedCheck = options?.isAnimatedCheck ?? false;

	const { entryId, isEditMode, cycle } = useEntryContext();
	const { updateEntry, loadEntry } = useEntries();
	const { saveEmotions, getEmotions } = useEmotions();
	const { journals, createJournal } = useJournals();

	const [selectedJournalId, setSelectedJournalId] = useState<string | null>(null);
	const [hasContent, setHasContent] = useState(isEditMode);
	const [isLoading, setIsLoading] = useState(isEditMode);
	const [defaultHtml, setDefaultHtml] = useState('');
	const [defaultEmotions, setDefaultEmotions] = useState<readonly EmotionSelection[]>([]);
	const [autoSaveContent, setAutoSaveContent] = useState({ html: '', text: '' });

	const editorRef = useRef<EditorHandle>(null);
	const emotionSelectionsRef = useRef<EmotionSelection[]>([]);
	const htmlRef = useRef('');
	const textRef = useRef('');

	const checkProgress = useSharedValue(isEditMode ? 1 : 0);

	const checkButtonStyle = useAnimatedStyle(() => ({
		opacity: checkProgress.value,
		transform: [{ translateX: (1 - checkProgress.value) * -8 }],
	}));

	// Default to first journal in create mode
	useEffect(() => {
		if (!isEditMode && journals.length > 0 && !selectedJournalId) {
			setSelectedJournalId(journals[0]?.id ?? null);
		}
	}, [isEditMode, journals, selectedJournalId]);

	// Load existing entry + emotions in edit mode
	useEffect(() => {
		if (!isEditMode) return;

		let isActive = true;

		Promise.all([loadEntry(entryId), getEmotions(entryId)])
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
	}, [isEditMode, entryId, loadEntry, getEmotions]);

	useAutoSave(entryId, autoSaveContent);

	const handleTextChange = useCallback(
		(text: string, html: string) => {
			const hasText = text.trim().length > 0;
			htmlRef.current = html;
			textRef.current = text;
			setAutoSaveContent({ html, text });
			setHasContent(hasText);

			if (isAnimatedCheck) {
				checkProgress.value = withSpring(hasText ? 1 : 0);
			}
		},
		[isAnimatedCheck, checkProgress],
	);

	const handleHtmlChange = useCallback((html: string) => {
		htmlRef.current = html;
		setAutoSaveContent((prev) => ({ ...prev, html }));
	}, []);

	const handleEmotionSave = useCallback((selections: readonly EmotionSelection[]) => {
		emotionSelectionsRef.current = [...selections];
		setDefaultEmotions([...selections]);
	}, []);

	const handleFinish = useCallback(() => {
		const saves: Promise<void>[] = [
			updateEntry(entryId, htmlRef.current, textRef.current, selectedJournalId ?? undefined),
		];

		if (emotionSelectionsRef.current.length > 0) {
			saves.push(
				saveEmotions(
					entryId,
					emotionSelectionsRef.current.map((s) => ({
						category: s.emotion,
						intensity: s.intensity,
					})),
				),
			);
		}

		Promise.all(saves).catch((err: unknown) => {
			const message = err instanceof Error ? err.message : 'Failed to save entry';
			Alert.alert('Save Error', message);
		});

		onFinish?.(entryId);
	}, [entryId, selectedJournalId, updateEntry, saveEmotions, onFinish]);

	const handleCreateJournal = useCallback(
		async (name: string, icon: string) => {
			const journal = await createJournal(name, icon);
			setSelectedJournalId(journal.id);
		},
		[createJournal],
	);

	const handleClear = useCallback(async () => {
		editorRef.current?.clear();
		setHasContent(false);
		setAutoSaveContent({ html: '', text: '' });
		htmlRef.current = '';
		textRef.current = '';
		emotionSelectionsRef.current = [];
		setDefaultEmotions([]);
		checkProgress.value = withSpring(0);
		await cycle();
	}, [checkProgress, cycle]);

	return {
		selectedJournalId,
		setSelectedJournalId,
		entryId,
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
