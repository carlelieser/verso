import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Portal } from '@gorhom/portal';
import { Button } from 'heroui-native';
import { SmilePlus } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Keyboard, Text, View } from 'react-native';

import { EmotionIntensityList } from '@/components/entry/emotion-intensity-list';
import { MenuDial } from '@/components/menu-dial';
import { FEELING_WHEEL } from '@/constants/emotions';
import { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useConfirmDialog } from '@/providers/dialog-provider';
import { useEntryContext } from '@/providers/entry-provider';
import type { EmotionCategory } from '@/types/common';
import { isEmotionCategory } from '@/types/common';
import type { EmotionSelection } from '@/types/emotion';

interface EmotionButtonProps {
	readonly defaultSelections?: readonly EmotionSelection[];
	readonly onSave: (selections: readonly EmotionSelection[]) => void;
}

export function EmotionButton({
	defaultSelections,
	onSave,
}: EmotionButtonProps): React.JSX.Element {
	const { accent, muted } = useThemeColors();
	const { entryId } = useEntryContext();
	const dialog = useConfirmDialog();
	const sheet = useBottomSheet({
		maxDynamicContentSize: 700,
	});

	const [addedEmotions, setAddedEmotions] = useState<readonly EmotionCategory[]>(
		() => defaultSelections?.map((s) => s.emotion) ?? [],
	);
	const hasSelections = addedEmotions.length > 0;

	const handleSelect = useCallback((path: string[]) => {
		const emotionKey = path[path.length - 1];
		if (!emotionKey || !isEmotionCategory(emotionKey)) return;

		setAddedEmotions((prev) => {
			if (prev.includes(emotionKey)) return prev;
			return [...prev, emotionKey];
		});
	}, []);

	const handleDone = useCallback(
		(selections: readonly EmotionSelection[]) => {
			onSave(selections);
			sheet.close();
		},
		[onSave, sheet],
	);

	const handleReset = useCallback(async () => {
		const confirmed = await dialog.confirm({
			title: 'Reset Emotions',
			description: 'All selected emotions will be cleared.',
			confirmLabel: 'Reset',
			variant: 'danger',
		});
		if (confirmed) {
			setAddedEmotions([]);
			onSave([]);
		}
	}, [dialog, onSave]);

	const handlePress = useCallback(() => {
		Keyboard.dismiss();
		sheet.open();
	}, [sheet]);

	return (
		<>
			<Button variant="ghost" size="sm" isIconOnly onPress={handlePress}>
				<SmilePlus size={16} color={hasSelections ? accent : muted} />
			</Button>

			{sheet.isOpen ? (
				<Portal>
					<BottomSheet ref={sheet.ref} {...sheet.sheetProps}>
						<BottomSheetScrollView>
							<View key={entryId} className="pt-6 pb-12 gap-6">
								<View className="gap-1 px-6">
									<Text className="text-3xl font-heading text-foreground pb-1">
										How are you feeling?
									</Text>
									<Text className="text-xs text-muted leading-5">
										Drag your finger around to select. Double-tap to get more
										specific. Tap to add.
									</Text>
								</View>

								<View className="items-center">
									<MenuDial items={FEELING_WHEEL} onSelect={handleSelect} />
								</View>

								<EmotionIntensityList
									additions={addedEmotions}
									defaultSelections={defaultSelections ?? []}
									onDone={handleDone}
									onReset={handleReset}
								/>
							</View>
						</BottomSheetScrollView>
					</BottomSheet>
				</Portal>
			) : null}
		</>
	);
}
