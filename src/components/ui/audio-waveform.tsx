import React from 'react';
import { View } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

interface AudioWaveformProps {
	readonly amplitudes: readonly SharedValue<number>[];
	readonly color: string;
	readonly size?: number;
}

const MIN_HEIGHT = 3;

function Bar({
	amplitude,
	color,
	maxHeight,
}: {
	readonly amplitude: SharedValue<number>;
	readonly color: string;
	readonly maxHeight: number;
}): React.JSX.Element {
	const style = useAnimatedStyle(() => {
		const h = MIN_HEIGHT + amplitude.value * (maxHeight - MIN_HEIGHT);
		return {
			height: h,
			transform: [{ translateY: (maxHeight - h) / 2 }],
		};
	});

	return (
		<Animated.View style={[{ width: 3, height: MIN_HEIGHT, borderRadius: 1.5, backgroundColor: color, transform: [{ translateY: (maxHeight - MIN_HEIGHT) / 2 }] }, style]} />
	);
}

export function AudioWaveform({
	amplitudes,
	color,
	size = 10,
}: AudioWaveformProps): React.JSX.Element {
	return (
		<View
			style={{ width: size, height: size }}
			className="flex-row justify-center gap-0.5"
		>
			{amplitudes.map((amp, i) => (
				<Bar key={i} amplitude={amp} color={color} maxHeight={size} />
			))}
		</View>
	);
}
