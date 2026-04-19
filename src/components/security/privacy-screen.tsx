import React, { useEffect, useState } from 'react';
import { AppState, Image } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useSecurity } from '@/hooks/use-security';

export function PrivacyScreen(): React.JSX.Element | null {
	const { isRequirePin, hasPin } = useSecurity();
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		if (!isRequirePin || !hasPin) {
			setIsVisible(false);
			return;
		}
		const blurSub = AppState.addEventListener('blur', () => setIsVisible(true));
		const focusSub = AppState.addEventListener('focus', () => setIsVisible(false));
		return () => {
			blurSub.remove();
			focusSub.remove();
		};
	}, [isRequirePin, hasPin]);

	if (!isVisible) return null;

	return (
		<Animated.View
			entering={FadeIn.duration(150)}
			exiting={FadeOut.duration(150)}
			pointerEvents="none"
			className="absolute inset-0 bg-background items-center justify-center z-50"
		>
			<Image
				source={require('../../../assets/images/splash-icon.png')}
				className="size-48"
				resizeMode="contain"
			/>
		</Animated.View>
	);
}
