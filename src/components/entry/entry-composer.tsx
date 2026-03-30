import { router } from 'expo-router';
import { Button } from 'heroui-native';
import { Check, Paperclip } from 'lucide-react-native';
import React, { forwardRef, useImperativeHandle } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Editor } from '@/components/entry/editor';
import { EmotionButton } from '@/components/entry/emotion-button';
import { JournalSelect } from '@/components/journal/journal-select';
import { OverflowMenu, type OverflowMenuItem } from '@/components/ui/overflow-menu';
import { useEntryComposer } from '@/hooks/use-entry-composer';
import { useKeyboardVisible } from '@/hooks/use-keyboard-visible';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useConfirmDialog } from '@/providers/dialog-provider';
import { EntryProvider } from '@/providers/entry-provider';

export type { OverflowMenuItem } from '@/components/ui/overflow-menu';

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
	/** Slot rendered after the overflow menu on the right. */
	readonly headerRight?: React.ReactNode;
	/** Items to display in the overflow (three-dot) menu. */
	readonly overflowMenuItems?: readonly OverflowMenuItem[];
	/** Called after the entry is successfully saved. */
	readonly onFinish?: (entryId: string) => void;
	/** Whether the check button animates in/out with content (default: false). */
	readonly isAnimatedCheck?: boolean;
	/** Placeholder text for the editor. */
	readonly placeholder?: string;
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
		},
		forwardedRef,
	) {
		const insets = useSafeAreaInsets();
		const { muted, accentForeground } = useThemeColors();
		const keyboardProgress = useKeyboardVisible();
		const headerAnimatedStyle = useAnimatedStyle(() => ({
			opacity: 1 - keyboardProgress.value,
			transform: [{ translateY: keyboardProgress.value * -10 }],
			height: keyboardProgress.value === 1 ? 0 : 'auto',
			overflow: 'hidden' as const,
		}));
		const dialog = useConfirmDialog();

		const composer = useEntryComposer({
			onFinish,
			isAnimatedCheck,
			onError: dialog.showError,
		});

		useImperativeHandle(forwardedRef, () => ({
			clear: () => composer.handleClear(),
		}));

		const checkButton = (
			<Button variant="primary" size="sm" isIconOnly onPress={composer.handleFinish}>
				<Check size={16} color={accentForeground} />
			</Button>
		);

		return (
			<>
				<View
					className="flex-1 bg-background"
					style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
				>
					{composer.isLoading ? (
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
											journals={composer.journals}
											selectedId={composer.selectedJournalId}
											onSelect={composer.setSelectedJournalId}
											onCreateJournal={composer.handleCreateJournal}
										/>
									</View>
									<View className="flex-row items-center">
										{isAnimatedCheck ? (
											<Animated.View style={composer.checkButtonStyle}>
												{checkButton}
											</Animated.View>
										) : (
											<View>{checkButton}</View>
										)}
										<EmotionButton
											defaultSelections={composer.defaultEmotions}
											onSave={composer.handleEmotionSave}
										/>
										<Button
											variant="ghost"
											size="sm"
											isIconOnly
											onPress={() => {
												const journalId = composer.selectedJournalId;
												if (journalId) {
													router.push(
														`/journal/${journalId}/entry/${composer.entryId}/attachments`,
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
								ref={composer.editorRef}
								defaultValue={composer.defaultHtml}
								placeholder={placeholder}
								onChangeText={(text) =>
									composer.handleTextChange(text, composer.htmlRef.current)
								}
								onChangeHtml={composer.handleHtmlChange}
							/>
						</>
					)}
				</View>

			</>
		);
	},
);
