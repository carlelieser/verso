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
	const style = useAnimatedStyle(() => ({
		height: MIN_HEIGHT + amplitude.value * (maxHeight - MIN_HEIGHT),
	}));

	return (
		<Animated.View style={[{ width: 3, borderRadius: 1.5, backgroundColor: color }, style]} />
	);
}

export function AudioWaveform({
	amplitudes,
	color,
	size = 18,
}: AudioWaveformProps): React.JSX.Element {
	return (
		<View
			style={{ width: size, height: size }}
			className="flex-row items-center justify-center gap-0.5"
		>
			{amplitudes.map((amp, i) => (
				<Bar key={i} amplitude={amp} color={color} maxHeight={size} />
			))}
		</View>
	);
}
