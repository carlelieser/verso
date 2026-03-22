import { Check, SmilePlus } from 'lucide-react-native';
import React, { forwardRef, useImperativeHandle } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';

import { Button } from 'heroui-native';

import { AppearanceToggle } from '@/components/appearance-toggle';
import { CreateJournal } from '@/components/create-journal';
import { Editor } from '@/components/editor';
import { EmotionCheckin } from '@/components/emotion-checkin';
import { JournalSelect } from '@/components/journal-select';
import { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { useEntryComposer } from '@/hooks/use-entry-composer';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { EmotionCategory, EmotionIntensity } from '@/types/common';

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
			entryId,
			initialJournalId,
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
		const { muted, accentForeground } = useThemeColors();

		const composer = useEntryComposer({
			entryId,
			initialJournalId,
			onFinish,
			isAnimatedCheck,
		});

		const emotionSheet = useBottomSheet({
			maxDynamicContentSize: insets.top > 0 ? undefined : 600,
		});
		const createSheet = useBottomSheet();

		useImperativeHandle(forwardedRef, () => ({
			clear: () => composer.handleClear(),
		}));

		const handleEmotionSave = (selections: readonly { readonly emotion: EmotionCategory; readonly intensity: EmotionIntensity }[]) => {
			composer.handleEmotionSave(selections);
			emotionSheet.close();
		};

		const handleCreateJournal = async (name: string, icon: string): Promise<void> => {
			await composer.handleCreateJournal(name, icon);
			createSheet.close();
		};

		const checkButton = (
			<Button variant="primary" size="sm" isIconOnly onPress={composer.handleFinish}>
				<Check size={16} color={accentForeground} />
			</Button>
		);

		return (
			<>
				<View className="flex-1 bg-background" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
					{composer.isLoading ? <View className="flex-1" /> : (
					<>
					<View className="flex-row items-center justify-between p-3 pr-0">
						<View className="flex-row items-center">
							{headerLeft}
							<JournalSelect
								journals={composer.journals}
								selectedId={composer.selectedJournalId}
								onSelect={composer.setSelectedJournalId}
								onCreate={createSheet.open}
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
								onPress={emotionSheet.open}
							>
								<SmilePlus size={16} color={muted} />
							</Button>
							{isAnimatedCheck ? (
								<Animated.View style={composer.checkButtonStyle}>
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
						ref={composer.editorRef}
						defaultValue={composer.defaultHtml}
						placeholder={placeholder}
						onChangeText={(text) => composer.handleTextChange(text, composer.htmlRef.current)}
						onChangeHtml={composer.handleHtmlChange}
					/>
					</>
					)}
				</View>

				{emotionSheet.isOpen ? (
					<BottomSheet
						ref={emotionSheet.ref}
						{...emotionSheet.sheetProps}
					>
						<BottomSheetScrollView>
							<EmotionCheckin
								key={composer.currentEntryId ?? 'new'}
								onSave={handleEmotionSave}
								defaultSelections={composer.defaultEmotions.length > 0 ? composer.defaultEmotions : undefined}
							/>
						</BottomSheetScrollView>
					</BottomSheet>
				) : null}

				{createSheet.isOpen ? (
					<BottomSheet
						ref={createSheet.ref}
						{...createSheet.sheetProps}
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
