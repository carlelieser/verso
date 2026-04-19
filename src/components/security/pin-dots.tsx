import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
	LinearTransition,
	ZoomOut,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from 'react-native-reanimated';

interface PinDotsProps {
	readonly length: number;
	readonly maxLength: number;
}

interface DotProps {
	readonly isFilled: boolean;
}

function Dot({ isFilled }: DotProps): React.JSX.Element {
	const fill = useSharedValue(0);

	useEffect(() => {
		fill.value = withSpring(isFilled ? 1 : 0, {
			damping: 9,
			stiffness: 400,
			mass: 0.5,
		});
	}, [isFilled, fill]);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: 0.7 + fill.value * 0.3 }],
		opacity: fill.value,
	}));

	return (
		<Animated.View layout={LinearTransition.duration(150)} exiting={ZoomOut.duration(150)}>
			<Animated.View className="size-4 rounded-full bg-foreground" style={animatedStyle} />
		</Animated.View>
	);
}

export function PinDots({ length, maxLength }: PinDotsProps): React.JSX.Element {
	const slots = Math.min(Math.max(0, length), maxLength);
	return (
		<View className="flex-row items-center justify-center gap-3 h-4">
			{Array.from({ length: slots }).map((_, i) => (
				<Dot key={i} isFilled={i < length} />
			))}
		</View>
	);
}
