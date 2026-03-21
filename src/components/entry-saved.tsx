import {Sparkles} from 'lucide-react-native';
import React, {useEffect} from 'react';
import {Text, View} from 'react-native';
import Animated, {
	FadeIn,
	FadeOut,
	SlideInDown,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withSpring,
} from 'react-native-reanimated';
import {useCSSVariable} from 'uniwind';

const ENCOURAGEMENTS = [
	'Thoughts captured.',
	'Well reflected.',
	'Another page written.',
	'Your words matter.',
	'Beautifully expressed.',
	'Moment preserved.',
] as const;

function getEncouragement(): string {
	const index = Math.floor(Math.random() * ENCOURAGEMENTS.length);
	return ENCOURAGEMENTS[index] ?? ENCOURAGEMENTS[0];
}

interface EntrySavedProps {
	readonly onComplete: () => void;
}

export function EntrySaved({onComplete}: EntrySavedProps): React.JSX.Element {
	const [accent, muted] = useCSSVariable(['--color-accent', '--color-muted']);
	const iconScale = useSharedValue(0);

	useEffect(() => {
		iconScale.value = withDelay(200, withSpring(1, {damping: 12, stiffness: 150}));
		const timer = setTimeout(onComplete, 2000);
		return () => clearTimeout(timer);
	}, [iconScale, onComplete]);

	const iconStyle = useAnimatedStyle(() => ({
		transform: [{scale: iconScale.value}],
	}));

	return (
		<Animated.View
			entering={FadeIn.duration(300)}
			exiting={FadeOut.duration(300)}
			className="absolute inset-0 items-center justify-center bg-background"
		>
			<Animated.View style={iconStyle}>
				<Sparkles size={48} color={accent as string}/>
			</Animated.View>
			<Animated.View entering={SlideInDown.delay(400).duration(400).springify()}>
				<Text className="text-2xl font-heading text-foreground mt-6 pb-1">
					{getEncouragement()}
				</Text>
			</Animated.View>
			<Animated.View entering={FadeIn.delay(600).duration(400)}>
				<Text className="text-sm text-muted mt-2">Entry saved</Text>
			</Animated.View>
		</Animated.View>
	);
}
