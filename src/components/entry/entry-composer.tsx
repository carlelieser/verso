import { router } from 'expo-router';
import { Button } from 'heroui-native';
import { Check, Paperclip } from 'lucide-react-native';
import React, { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Editor } from '@/components/entry/editor';
import { EmotionButton } from '@/components/entry/emotion-button';
import { JournalSelect } from '@/components/journal/journal-select';
import { OverflowMenu, type OverflowMenuItem } from '@/components/ui/overflow-menu';
import { useKeyboardVisible } from '@/hooks/use-keyboard-visible';
import { useLiveAttachments } from '@/hooks/use-live-attachments';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useConfirmDialog } from '@/providers/dialog-provider';
import { EntryProvider, useEntryContext } from '@/providers/entry-provider';
import type { Attachment } from '@/types/attachment';
import type { EmotionSelection } from '@/types/emotion';

export type { OverflowMenuItem } from '@/components/ui/overflow-menu';

export interface EntryComposerHandle {
	clear: () => void;
}

export interface EntrySummary {
	readonly entryId: string;
	readonly journalId: string;
	readonly emotions: readonly EmotionSelection[];
	readonly attachments: readonly Attachment[];
}

interface EntryComposerProps {
	/** Existing entry ID when editing. Null for new entries. */
	readonly entryId?: string | null;
	/** Pre-select a journal by ID in create mode. */
	readonly initialJournalId?: string | null;
	/** Slot rendered before the journal select on the left. */
	readonly headerLeft?: React.ReactNode;
	/** Slot rendered after the overflow menu on the right. */
	readonly headerRight?: React.ReactNode;
	/** Items to display in the overflow (three-dot) menu. */
	readonly overflowMenuItems?: readonly OverflowMenuItem[];
	/** Called after the entry is successfully saved. */
	readonly onFinish?: (summary: EntrySummary) => void;
	/** Whether the check button animates in/out with content (default: false). */
	readonly isAnimatedCheck?: boolean;
	/** Placeholder text for the editor. */
	readonly placeholder?: string;
	/** Skip the bottom safe-area inset — e.g. when a tab bar already provides spacing. */
	readonly disableBottomInset?: boolean;
}

export const EntryComposer = forwardRef<EntryComposerHandle, EntryComposerProps>(
	function EntryComposer({ entryId, initialJournalId, ...rest }, forwardedRef) {
		return (
			<EntryProvider entryId={entryId} journalId={initialJournalId}>
				<EntryComposerInner ref={forwardedRef} {...rest} />
			</EntryProvider>
		);
	},
);

type EntryComposerInnerProps = Omit<EntryComposerProps, 'entryId' | 'initialJournalId'>;

const EntryComposerInner = forwardRef<EntryComposerHandle, EntryComposerInnerProps>(
	function EntryComposerInner(
		{
			headerLeft,
			headerRight,
			overflowMenuItems,
			onFinish,
			isAnimatedCheck = false,
			placeholder = "What's on your mind?",
			disableBottomInset = false,
		},
		forwardedRef,
	) {
		const insets = useSafeAreaInsets();
		const { muted, accentForeground } = useThemeColors();
		const keyboardProgress = useKeyboardVisible();
		const dialog = useConfirmDialog();
		const context = useEntryContext();
		const attachments = useLiveAttachments(context.entryId);

		const initialContent = useRef<string | null>(null);
		if (!context.isLoading && initialContent.current === null) {
			initialContent.current = context.contentHtmlRef.current;
		}

		const headerAnimatedStyle = useAnimatedStyle(() => ({
			opacity: 1 - keyboardProgress.value,
			transform: [{ translateY: keyboardProgress.value * -10 }],
			height: keyboardProgress.value === 1 ? 0 : 'auto',
			overflow: 'hidden' as const,
		}));

		const checkProgress = useSharedValue(context.isEditMode ? 1 : 0);

		const checkButtonStyle = useAnimatedStyle(() => ({
			opacity: checkProgress.value,
			transform: [{ translateX: (1 - checkProgress.value) * -8 }],
			pointerEvents: checkProgress.value === 0 ? 'none' : 'auto',
		}));

		const handleTextChange = useCallback(
			(text: string) => {
				context.setContent(context.contentHtmlRef.current, text);

				if (isAnimatedCheck) {
					checkProgress.value = withSpring(text.trim().length > 0 ? 1 : 0);
				}
			},
			[context, isAnimatedCheck, checkProgress],
		);

		const handleFinish = useCallback(() => {
			context.save();
			onFinish?.({
				entryId: context.entryId,
				journalId: context.journalId ?? '',
				emotions: context.emotions,
				attachments,
			});
		}, [context, onFinish, attachments]);

		useImperativeHandle(forwardedRef, () => ({
			clear: () => {
				checkProgress.value = withSpring(0);
				context.cycle().catch((err: unknown) => {
					dialog.showError('Error', String(err));
				});
			},
		}));

		const checkButton = (
			<Button variant="primary" size="sm" isIconOnly onPress={handleFinish}>
				<Check size={16} color={accentForeground} />
			</Button>
		);

		return (
			<>
				<View
					className="flex-1 bg-background"
					style={{
						paddingTop: insets.top,
						paddingBottom: disableBottomInset ? 0 : insets.bottom,
					}}
				>
					{context.isLoading ? (
						<View className="flex-1" />
					) : (
						<>
							<View className="h-18">
								<Animated.View
									className="flex-row items-center justify-between p-3"
									style={headerAnimatedStyle}
								>
									<View className="flex-row items-center">
										{headerLeft}
										<JournalSelect
											journals={context.journals}
											selectedId={context.journalId}
											onSelect={context.setJournalId}
											onCreateJournal={context.createJournal}
										/>
									</View>
									<View className="flex-row items-center">
										{isAnimatedCheck ? (
											<Animated.View style={checkButtonStyle}>
												{checkButton}
											</Animated.View>
										) : (
											<View>{checkButton}</View>
										)}
										<EmotionButton />
										<Button
											variant="ghost"
											size="sm"
											isIconOnly
											onPress={() => {
												const currentJournalId = context.journalId;
												if (currentJournalId) {
													router.push(
														`/journal/${currentJournalId}/entry/${context.entryId}/attachments`,
													);
												}
											}}
										>
											<Paperclip size={16} color={muted} />
										</Button>
										{headerRight}
										{overflowMenuItems ? (
											<OverflowMenu items={overflowMenuItems} />
										) : null}
									</View>
								</Animated.View>
							</View>

							<Editor
								ref={context.editorRef}
								defaultValue={initialContent.current ?? ''}
								placeholder={placeholder}
								onChangeText={handleTextChange}
								onChangeHtml={context.updateHtml}
							/>
						</>
					)}
				</View>
			</>
		);
	},
);
