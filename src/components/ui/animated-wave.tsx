import React, { useCallback, useEffect, useState } from 'react';
import { type LayoutChangeEvent, View, type ViewStyle } from 'react-native';
import Animated, {
	cancelAnimation,
	useAnimatedProps,
	useSharedValue,
	withRepeat,
	withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
import { WavePath } from 'react-native-waves/lib/worklets';

interface AnimatedWaveProps {
	readonly width: number;
	readonly height: number;
	readonly fill: string;
	readonly maxPoints?: number;
	readonly speed?: number;
	readonly delta?: number;
	readonly waveHeight?: number;
	readonly initialTick?: number;
	readonly style?: ViewStyle;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

export function AnimatedWave({
	width,
	height,
	fill,
	maxPoints = 3,
	speed = 7.5,
	delta = 60,
	waveHeight,
	initialTick = 0,
	style,
}: AnimatedWaveProps): React.JSX.Element {
	const effectiveWaveHeight = waveHeight ?? height * 0.3;
	const tick = useSharedValue(initialTick);
	const loop = useSharedValue(0);
	const path = useSharedValue('');

	useEffect(() => {
		if (width === 0) return;
		const step = (): void => {
			'worklet';
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
			path.value = WavePath(maxPoints, speed, delta)
				.getPoints(tick.value * Math.PI, width, effectiveWaveHeight)
				.build(width, height);
			if (tick.value > 800) {
				tick.value = 0;
			} else {
				tick.value += 0.1;
			}
		};
		loop.value = withRepeat(withTiming(0, { duration: 0 }, step), -1, false);
		return () => cancelAnimation(loop);
	}, [width, height, maxPoints, speed, delta, effectiveWaveHeight, loop, path, tick]);

	const animatedProps = useAnimatedProps(() => ({ d: path.value }));

	if (width === 0) return <></>;

	return (
		<Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={style}>
			<AnimatedPath animatedProps={animatedProps} fill={fill} />
		</Svg>
	);
}

interface AutoSizedWaveProps extends Omit<AnimatedWaveProps, 'width'> {
	readonly containerStyle?: ViewStyle;
}

/** Measures its container width and renders an `AnimatedWave` that fills it. */
const WAVE_RIGHT_OVERSHOOT = 1;

export function AutoSizedWave({
	height,
	containerStyle,
	...waveProps
}: AutoSizedWaveProps): React.JSX.Element {
	const [width, setWidth] = useState(0);

	const handleLayout = useCallback((e: LayoutChangeEvent): void => {
		setWidth(e.nativeEvent.layout.width);
	}, []);

	return (
		<View style={[{ height, overflow: 'hidden' }, containerStyle]} onLayout={handleLayout}>
			<AnimatedWave
				width={width + WAVE_RIGHT_OVERSHOOT}
				height={height}
				{...waveProps}
			/>
		</View>
	);
}
