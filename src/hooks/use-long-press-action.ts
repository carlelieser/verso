import * as Haptics from 'expo-haptics';
import { useCallback, useState } from 'react';

import { useBottomSheet } from '@/hooks/use-bottom-sheet';

interface UseLongPressActionResult<T> {
	readonly selectedItem: T | null;
	readonly handleLongPress: (item: T) => void;
	readonly actionSheet: ReturnType<typeof useBottomSheet>;
}

export function useLongPressAction<T>(): UseLongPressActionResult<T> {
	const [selectedItem, setSelectedItem] = useState<T | null>(null);
	const actionSheet = useBottomSheet();

	const handleLongPress = useCallback(
		(item: T) => {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
			setSelectedItem(item);
			actionSheet.open();
		},
		[actionSheet],
	);

	return { selectedItem, handleLongPress, actionSheet };
}
