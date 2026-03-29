import { Button } from 'heroui-native';
import { CheckIcon } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
	Easing,
	FadeIn,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withRepeat,
	withSequence,
	withSpring,
	withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '@/hooks/use-theme-colors';

const ENCOURAGEMENTS = [
	'Thoughts captured.',
	'Well reflected.',
	'Another page written.',
	'Your words matter.',
	'Beautifully expressed.',
	'Moment preserved.',
] as const;

const PROGRESS_DURATION_MS = 4000;
const FADE_OUT_DURATION_MS = 500;
const BOUNCE_DURATION_MS = 800;
const BOUNCE_OFFSET = -8;
const TRACK_HEIGHT = 4;

function getEncouragement(): string {
	const index = Math.floor(Math.random() * ENCOURAGEMENTS.length);
	return ENCOURAGEMENTS[index] ?? ENCOURAGEMENTS[0];
}

interface EntrySavedProps {
	readonly onComplete: () => void;
}

export function EntrySaved({ onComplete }: EntrySavedProps): React.JSX.Element {
	const { accent, border, muted } = useThemeColors();
	const { width: screenWidth } = useWindowDimensions();
	const insets = useSafeAreaInsets();

	const iconScale = useSharedValue(0);
	const iconTranslateY = useSharedValue(0);
	const progress = useSharedValue(0);
	const overlayOpacity = useSharedValue(0);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		// Fade in, hold for progress duration, then fade out
		overlayOpacity.value = withSequence(
			withTiming(1, { duration: 300 }),
			withDelay(
				PROGRESS_DURATION_MS - 300,
				withTiming(0, { duration: FADE_OUT_DURATION_MS }),
			),
		);

		// Icon spring in, then continuous bounce
		iconScale.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 150 }));
		iconTranslateY.value = withDelay(
			400,
			withRepeat(
				withSequence(
					withTiming(BOUNCE_OFFSET, {
						duration: BOUNCE_DURATION_MS / 2,
						easing: Easing.inOut(Easing.ease),
					}),
					withTiming(0, {
						duration: BOUNCE_DURATION_MS / 2,
						easing: Easing.inOut(Easing.ease),
					}),
				),
				-1,
				false,
			),
		);

		// Progress bar fills over 4s
		progress.value = withTiming(1, {
			duration: PROGRESS_DURATION_MS,
			easing: Easing.linear,
		});

		timerRef.current = setTimeout(onComplete, PROGRESS_DURATION_MS + FADE_OUT_DURATION_MS);
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, [iconScale, iconTranslateY, onComplete, overlayOpacity, progress]);

	const handleDismiss = useCallback(() => {
		if (timerRef.current) clearTimeout(timerRef.current);
		overlayOpacity.value = withTiming(0, { duration: FADE_OUT_DURATION_MS });
		timerRef.current = setTimeout(onComplete, FADE_OUT_DURATION_MS);
	}, [onComplete, overlayOpacity]);

	const overlayStyle = useAnimatedStyle(() => ({
		opacity: overlayOpacity.value,
	}));

	const iconStyle = useAnimatedStyle(() => ({
		transform: [{ scale: iconScale.value }, { translateY: iconTranslateY.value }],
	}));

	const progressStyle = useAnimatedStyle(() => ({
		width: progress.value * screenWidth,
	}));

	return (
		<Animated.View
			style={[overlayStyle, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
			className="absolute inset-0 items-center justify-center bg-background"
		>
			<Animated.View style={iconStyle}>
				<CheckIcon size={48} color={accent} />
			</Animated.View>
			<Animated.View entering={FadeIn.delay(400).duration(400).springify()}>
				<Text className="text-4xl font-heading text-foreground mt-6 pb-1">
					{getEncouragement()}
				</Text>
			</Animated.View>
			<Animated.View entering={FadeIn.delay(600).duration(400)}>
				<Text className="text-sm text-muted mt-2">Entry saved</Text>
			</Animated.View>

			<View style={[styles.trackContainer, { top: insets.top, backgroundColor: border }]}>
				<Animated.View
					style={[styles.trackFill, { backgroundColor: muted }, progressStyle]}
				/>
			</View>

			<View style={[styles.buttonContainer, { bottom: insets.bottom + 16, right: 16 }]}>
				<Button variant={'secondary'} onPress={handleDismiss}>
					Got it.
				</Button>
			</View>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	trackContainer: {
		position: 'absolute',
		left: 0,
		right: 0,
		height: TRACK_HEIGHT,
	},
	trackFill: {
		height: TRACK_HEIGHT,
	},
	buttonContainer: {
		position: 'absolute' as const,
	},
});
