import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Portal } from '@gorhom/portal';
import { Button } from 'heroui-native';
import { SmilePlus } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmotionCheckin } from '@/components/entry/emotion-checkin';
import { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useEntryContext } from '@/providers/entry-provider';
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
	const insets = useSafeAreaInsets();
	const sheet = useBottomSheet({
		maxDynamicContentSize: insets.top > 0 ? undefined : 600,
	});

	const [selections, setSelections] = useState<readonly EmotionSelection[]>(
		defaultSelections ?? [],
	);

	const handleSave = useCallback(
		(newSelections: readonly EmotionSelection[]) => {
			setSelections(newSelections);
			onSave(newSelections);
			sheet.close();
		},
		[onSave, sheet],
	);

	const handleChange = useCallback(
		(newSelections: readonly EmotionSelection[]) => {
			setSelections(newSelections);
			onSave(newSelections);
		},
		[onSave],
	);

	const handlePress = useCallback(() => {
		Keyboard.dismiss();
		sheet.open();
	}, [sheet]);

	return (
		<>
			<Button variant="ghost" size="sm" isIconOnly onPress={handlePress}>
				<SmilePlus size={16} color={selections.length > 0 ? accent : muted} />
			</Button>

			{sheet.isOpen ? (
				<Portal>
					<BottomSheet ref={sheet.ref} {...sheet.sheetProps}>
						<BottomSheetScrollView>
							<EmotionCheckin
								key={entryId}
								onSave={handleSave}
								onChange={handleChange}
								defaultSelections={selections.length > 0 ? selections : undefined}
							/>
						</BottomSheetScrollView>
					</BottomSheet>
				</Portal>
			) : null}
		</>
	);
}
