import { useEffect } from 'react';
import { Keyboard } from 'react-native';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

const ANIMATION_DURATION = 200;

/**
 * Returns a shared value that animates between 0 (hidden) and 1 (visible)
 * when the keyboard shows/hides.
 */
export function useKeyboardVisible(): SharedValue<number> {
	const progress = useSharedValue(0);

	useEffect(() => {
		const showSub = Keyboard.addListener('keyboardDidShow', () => {
			progress.value = withTiming(1, { duration: ANIMATION_DURATION });
		});
		const hideSub = Keyboard.addListener('keyboardDidHide', () => {
			progress.value = withTiming(0, { duration: ANIMATION_DURATION });
		});
		return () => {
			showSub.remove();
			hideSub.remove();
		};
	}, [progress]);

	return progress;
}
