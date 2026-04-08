import { Button } from 'heroui-native';
import { SmilePlus } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { Keyboard } from 'react-native';

import { EmotionSheet } from '@/components/entry/emotion-sheet';
import { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useEntryContext } from '@/providers/entry-provider';

export function EmotionButton(): React.JSX.Element {
	const { accent, muted } = useThemeColors();
	const { emotions } = useEntryContext();
	const sheet = useBottomSheet({ maxDynamicContentSize: 700 });

	const handlePress = useCallback(() => {
		Keyboard.dismiss();
		sheet.open();
	}, [sheet]);

	return (
		<>
			<Button variant="ghost" size="sm" isIconOnly onPress={handlePress}>
				<SmilePlus size={16} color={emotions.length > 0 ? accent : muted} />
			</Button>

			{sheet.isOpen ? <EmotionSheet sheet={sheet} /> : null}
		</>
	);
}
