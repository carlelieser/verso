import { Check, SmilePlus } from 'lucide-react-native';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';

import { Button } from 'heroui-native';

import { AppearanceToggle } from '@/components/appearance-toggle';
import { CreateJournal } from '@/components/create-journal';
import { Editor, type EditorHandle } from '@/components/editor';
import { EmotionCheckin } from '@/components/emotion-checkin';
import { JournalSelect } from '@/components/journal-select';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useEmotions } from '@/hooks/use-emotions';
import { useEntries } from '@/hooks/use-entries';
import { useJournals } from '@/hooks/use-journals';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { EmotionCategory, EmotionIntensity } from '@/types/common';

interface EmotionSelection {
	readonly emotion: EmotionCategory;
	readonly intensity: EmotionIntensity;
}

export interface EntryComposerHandle {
	clear: () => void;
}

interface EntryComposerProps {
	/** Existing entry ID when editing. Null for new entries. */
	readonly entryId?: string | null;
	/** Pre-select a journal by ID in create mode. */
	readonly initialJournalId?: string | null;
	/** Slot rendered before the journal select on the left. */
	readonly headerLeft?: React.ReactNode;
	/** Slot rendered between the appearance toggle and the emotion button on the right. */
	readonly headerRight?: React.ReactNode;
	/** Called after the entry is successfully saved. */
	readonly onFinish?: (entryId: string) => void;
	/** Whether the check button animates in/out with content (default: false). */
	readonly isAnimatedCheck?: boolean;
	/** Placeholder text for the editor. */
	readonly placeholder?: string;
	/** Callback when "View All" is pressed in the journal select. */
	readonly onViewAllJournals?: () => void;
}

export const EntryComposer = forwardRef<EntryComposerHandle, EntryComposerProps>(
	function EntryComposer(
		{
			entryId: initialEntryId = null,
			initialJournalId = null,
			headerLeft,
			headerRight,
			onFinish,
			isAnimatedCheck = false,
			placeholder = 'What\'s on your mind?',
			onViewAllJournals,
		},
		forwardedRef,
	) {
		const insets = useSafeAreaInsets();
		const { muted, surface, accentForeground } = useThemeColors();
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

		const [isEmotionSheetOpen, setIsEmotionSheetOpen] = useState(false);
		const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
		const emotionSheetRef = useRef<BottomSheet>(null);
		const createSheetRef = useRef<BottomSheet>(null);
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

		useImperativeHandle(forwardedRef, () => ({
			clear: () => {
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
			},
		}));

		// Load existing entry + emotions in edit mode
		useEffect(() => {
			if (!initialEntryId) return;

			let isActive = true;

			Promise.all([loadEntry(initialEntryId), getEmotions(initialEntryId)]).then(
				([entry, emotions]) => {
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
				},
			);

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

		const handleEmotionSave = useCallback(
			(selections: readonly { readonly emotion: EmotionCategory; readonly intensity: EmotionIntensity }[]) => {
				emotionSelectionsRef.current = [...selections];
				setDefaultEmotions([...selections]);
				emotionSheetRef.current?.close();
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
				setIsCreateSheetOpen(false);
			},
			[createJournal],
		);

		const checkButton = (
			<Button variant="primary" size="sm" isIconOnly onPress={handleFinish}>
				<Check size={16} color={accentForeground} />
			</Button>
		);

		return (
			<>
				<View className="flex-1 bg-background" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
					{isLoading ? <View className="flex-1" /> : (
					<>
					<View className="flex-row items-center justify-between p-3 pr-0">
						<View className="flex-row items-center">
							{headerLeft}
							<JournalSelect
								journals={journals}
								selectedId={selectedJournalId}
								onSelect={setSelectedJournalId}
								onCreate={() => setIsCreateSheetOpen(true)}
								onViewAll={onViewAllJournals}
							/>
						</View>
						<View className="flex-row items-center">
							<AppearanceToggle />
							{headerRight}
							<Button
								variant="ghost"
								size="sm"
								isIconOnly
								onPress={() => setIsEmotionSheetOpen(true)}
							>
								<SmilePlus size={16} color={muted} />
							</Button>
							{isAnimatedCheck ? (
								<Animated.View style={checkButtonStyle}>
									{checkButton}
								</Animated.View>
							) : (
								<View style={{ paddingRight: 12 }}>
									{checkButton}
								</View>
							)}
						</View>
					</View>

					<Editor
						ref={editorRef}
						defaultValue={defaultHtml}
						placeholder={placeholder}
						onChangeText={(text) => handleTextChange(text, htmlRef.current)}
						onChangeHtml={(html) => {
							htmlRef.current = html;
							if (currentEntryId) {
								setAutoSaveContent({ html, text: textRef.current });
							}
						}}
					/>
					</>
					)}
				</View>

				{isEmotionSheetOpen ? (
					<BottomSheet
						ref={emotionSheetRef}
						index={0}
						enablePanDownToClose
						enableDynamicSizing
						animationConfigs={{}}
						onClose={() => setIsEmotionSheetOpen(false)}
						backdropComponent={(props) => (
							<BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.5} />
						)}
						maxDynamicContentSize={insets.top > 0 ? undefined : 600}
						backgroundStyle={{ backgroundColor: surface }}
						handleIndicatorStyle={{ backgroundColor: muted }}
					>
						<BottomSheetScrollView>
							<EmotionCheckin
								key={currentEntryId ?? 'new'}
								onSave={handleEmotionSave}
								defaultSelections={defaultEmotions.length > 0 ? defaultEmotions : undefined}
							/>
						</BottomSheetScrollView>
					</BottomSheet>
				) : null}

				{isCreateSheetOpen ? (
					<BottomSheet
						ref={createSheetRef}
						index={0}
						enablePanDownToClose
						enableDynamicSizing
						animationConfigs={{}}
						onClose={() => setIsCreateSheetOpen(false)}
						backdropComponent={(props) => (
							<BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.5} />
						)}
						backgroundStyle={{ backgroundColor: surface }}
						handleIndicatorStyle={{ backgroundColor: muted }}
					>
						<BottomSheetView>
							<CreateJournal onCreate={handleCreateJournal} />
						</BottomSheetView>
					</BottomSheet>
				) : null}
			</>
		);
	},
);
