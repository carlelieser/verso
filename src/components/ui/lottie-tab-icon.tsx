import LottieView, { type AnimationObject } from 'lottie-react-native';
import React, { memo, useEffect, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';

const ICON_SIZE = 28;

function hexToRgbArray(hex: string): [number, number, number, number] {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	if (!result || !result[1] || !result[2] || !result[3]) return [0, 0, 0, 1];
	return [
		parseInt(result[1], 16) / 255,
		parseInt(result[2], 16) / 255,
		parseInt(result[3], 16) / 255,
		1,
	];
}

function replaceColorsInSource(source: AnimationObject, color: string): AnimationObject {
	const rgb = hexToRgbArray(color);
	const json = JSON.stringify(source);
	const replaced = json.replace(
		/"c"\s*:\s*\{\s*"a"\s*:\s*0\s*,\s*"k"\s*:\s*\[\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*\]/g,
		`"c":{"a":0,"k":[${rgb.join(',')}]`,
	);
	return JSON.parse(replaced) as AnimationObject;
}

interface LottieTabIconProps {
	readonly source: AnimationObject;
	readonly isFocused: boolean;
	readonly focusedColor: string;
	readonly inactiveColor: string;
}

export const LottieTabIcon = memo(function LottieTabIcon({
	source,
	isFocused,
	focusedColor,
	inactiveColor,
}: LottieTabIconProps): React.JSX.Element {
	const lottieRef = useRef<LottieView>(null);
	const wasFocusedRef = useRef(isFocused);

	useEffect(() => {
		if (isFocused && !wasFocusedRef.current) {
			requestAnimationFrame(() => {
				lottieRef.current?.reset();
				lottieRef.current?.play();
			});
		}
		wasFocusedRef.current = isFocused;
	}, [isFocused]);

	const currentColor = isFocused ? focusedColor : inactiveColor;
	const coloredSource = useMemo(
		() => replaceColorsInSource(source, currentColor),
		[source, currentColor],
	);

	return (
		<LottieView
			ref={lottieRef}
			source={coloredSource}
			style={styles.lottie}
			autoPlay={false}
			loop={false}
			speed={1}
		/>
	);
});

const styles = StyleSheet.create({
	lottie: {
		width: ICON_SIZE,
		height: ICON_SIZE,
	},
});
