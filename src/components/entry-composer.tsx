import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Button, Menu } from 'heroui-native';
import {
	Check,
	EllipsisVertical,
	MapPin,
	MapPinOff,
	SmilePlus,
} from 'lucide-react-native';
import React, { forwardRef, useEffect, useImperativeHandle } from 'react';
import { Keyboard, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CreateJournal } from '@/components/create-journal';
import { Editor } from '@/components/editor';
import { EmotionCheckin } from '@/components/emotion-checkin';
import { JournalSelect } from '@/components/journal-select';
import { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { useEntryComposer } from '@/hooks/use-entry-composer';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { EntryProvider } from '@/providers/entry-provider';
import type { EmotionSelection } from '@/types/emotion';

export interface EntryComposerHandle {
	clear: () => void;
}

export interface OverflowMenuItem {
	readonly id: string;
	readonly label: string;
	readonly icon?: React.ReactNode;
	readonly onPress: () => void;
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
	function EntryComposer(
		{ entryId, initialJournalId, ...rest },
		forwardedRef,
	) {
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
		const { accent, muted, accentForeground } = useThemeColors();

		const composer = useEntryComposer({
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

		const handleEmotionSave = (selections: readonly EmotionSelection[]) => {
			composer.handleEmotionSave(selections);
			emotionSheet.close();
		};

		const handleCreateJournal = async (name: string, icon: string): Promise<void> => {
			await composer.handleCreateJournal(name, icon);
			createSheet.close();
		};

		const isHeaderVisible = useSharedValue(1);

		useEffect(() => {
			const showSub = Keyboard.addListener('keyboardDidShow', () => {
				isHeaderVisible.value = withTiming(0, { duration: 200 });
			});
			const hideSub = Keyboard.addListener('keyboardDidHide', () => {
				isHeaderVisible.value = withTiming(1, { duration: 200 });
			});
			return () => {
				showSub.remove();
				hideSub.remove();
			};
		}, [isHeaderVisible]);

		const headerAnimatedStyle = useAnimatedStyle(() => ({
			opacity: isHeaderVisible.value,
			transform: [{ translateY: (1 - isHeaderVisible.value) * -10 }],
			height: isHeaderVisible.value === 0 ? 0 : 'auto',
			overflow: isHeaderVisible.value === 0 ? ('hidden' as const) : ('visible' as const),
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
							<View className={'h-14'}>
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
											onCreate={createSheet.open}
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
										<Button
											variant="ghost"
											size="sm"
											isIconOnly
											onPress={composer.toggleLocation}
										>
											{composer.isLocationEnabled ? (
												<MapPin size={16} color={accent} />
											) : (
												<MapPinOff size={16} color={muted} />
											)}
										</Button>
										<Button
											variant="ghost"
											size="sm"
											isIconOnly
											onPress={() => {
												composer.editorRef.current?.blur();
												emotionSheet.open();
											}}
										>
											<SmilePlus
												size={16}
												color={
													composer.defaultEmotions.length > 0
														? accent
														: muted
												}
											/>
										</Button>
										{headerRight}
										{overflowMenuItems && overflowMenuItems.length > 0 ? (
											<Menu presentation="popover">
												<Menu.Trigger asChild>
													<Button variant="ghost" size="sm" isIconOnly>
														<EllipsisVertical size={16} color={muted} />
													</Button>
												</Menu.Trigger>
												<Menu.Portal>
													<Menu.Overlay />
													<Menu.Content
														presentation="popover"
														width={200}
													>
														{overflowMenuItems.map((item) => (
															<Menu.Item
																key={item.id}
																id={item.id}
																shouldCloseOnSelect
																onPress={item.onPress}
															>
																{item.icon ?? null}
																<Menu.ItemTitle>
																	{item.label}
																</Menu.ItemTitle>
															</Menu.Item>
														))}
													</Menu.Content>
												</Menu.Portal>
											</Menu>
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

				{emotionSheet.isOpen ? (
					<BottomSheet ref={emotionSheet.ref} {...emotionSheet.sheetProps}>
						<BottomSheetScrollView>
							<EmotionCheckin
								key={composer.entryId}
								onSave={handleEmotionSave}
								onChange={composer.handleEmotionSave}
								defaultSelections={
									composer.defaultEmotions.length > 0
										? composer.defaultEmotions
										: undefined
								}
							/>
						</BottomSheetScrollView>
					</BottomSheet>
				) : null}

				{createSheet.isOpen ? (
					<BottomSheet ref={createSheet.ref} {...createSheet.sheetProps}>
						<BottomSheetScrollView keyboardShouldPersistTaps="handled">
							<CreateJournal onCreate={handleCreateJournal} />
						</BottomSheetScrollView>
					</BottomSheet>
				) : null}
			</>
		);
	},
);
