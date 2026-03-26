import { useEffect } from 'react';
import { Keyboard } from 'react-native';
import type { ViewStyle } from 'react-native';
import type { AnimatedStyle } from 'react-native-reanimated';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const ANIMATION_DURATION = 200;

export function useKeyboardAnimatedHeader(): AnimatedStyle<ViewStyle> {
	const isVisible = useSharedValue(1);

	useEffect(() => {
		const showSub = Keyboard.addListener('keyboardDidShow', () => {
			isVisible.value = withTiming(0, { duration: ANIMATION_DURATION });
		});
		const hideSub = Keyboard.addListener('keyboardDidHide', () => {
			isVisible.value = withTiming(1, { duration: ANIMATION_DURATION });
		});
		return () => {
			showSub.remove();
			hideSub.remove();
		};
	}, [isVisible]);

	return useAnimatedStyle(() => ({
		opacity: isVisible.value,
		transform: [{ translateY: (1 - isVisible.value) * -10 }],
		height: isVisible.value === 0 ? 0 : 'auto',
		overflow: isVisible.value === 0 ? ('hidden' as const) : ('visible' as const),
	}));
}
