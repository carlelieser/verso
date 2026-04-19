import * as Haptics from 'expo-haptics';
import { ArrowRightFromLine, Delete } from 'lucide-react-native';
import React from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
	interpolateColor,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

import { useThemeColors } from '@/hooks/use-theme-colors';

const KEYS: readonly (readonly [string, string, string])[] = [
	['1', '2', '3'],
	['4', '5', '6'],
	['7', '8', '9'],
];

interface PinPadProps {
	readonly onDigit: (digit: string) => void;
	readonly onDelete: () => void;
	readonly onSubmit: () => void;
	readonly canSubmit: boolean;
	readonly isDisabled?: boolean;
}

interface DigitKeyProps {
	readonly value: string;
	readonly onPress: (value: string) => void;
	readonly isDisabled: boolean;
}

const DigitKey = React.memo(DigitKeyImpl);

function DigitKeyImpl({ value, onPress, isDisabled }: DigitKeyProps): React.JSX.Element {
	const { accent, border, foreground, accentForeground } = useThemeColors();
	const active = useSharedValue(0);

	const handlePressIn = (): void => {
		Haptics.selectionAsync();
		active.value = withTiming(1, { duration: 80 });
		onPress(value);
	};

	const handlePressOut = (): void => {
		active.value = withTiming(0, { duration: 120 });
	};

	const containerStyle = useAnimatedStyle(() => ({
		transform: [{ scale: 1 - active.value * 0.08 }],
		backgroundColor: interpolateColor(active.value, [0, 1], [border, accent]),
	}));

	const textStyle = useAnimatedStyle(() => ({
		color: interpolateColor(active.value, [0, 1], [foreground, accentForeground]),
	}));

	return (
		<Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} disabled={isDisabled}>
			<Animated.View
				style={containerStyle}
				className="w-20 h-20 rounded-full items-center justify-center"
			>
				<Animated.Text style={textStyle} className="text-3xl">
					{value}
				</Animated.Text>
			</Animated.View>
		</Pressable>
	);
}

export function PinPad({
	onDigit,
	onDelete,
	onSubmit,
	canSubmit,
	isDisabled = false,
}: PinPadProps): React.JSX.Element {
	const { muted, foreground } = useThemeColors();

	const handleDelete = (): void => {
		Haptics.selectionAsync();
		onDelete();
	};

	const handleSubmit = (): void => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		onSubmit();
	};

	return (
		<View className="gap-4 items-center py-4">
			{KEYS.map((row, i) => (
				<View key={i} className="flex-row gap-8">
					{row.map((digit) => (
						<DigitKey
							key={digit}
							value={digit}
							onPress={onDigit}
							isDisabled={isDisabled}
						/>
					))}
				</View>
			))}
			<View className="flex-row gap-8 items-center">
				<Pressable
					onPress={handleDelete}
					disabled={isDisabled}
					className="w-20 h-20 rounded-full items-center justify-center active:bg-surface"
				>
					<Delete size={24} color={muted} />
				</Pressable>
				<DigitKey value="0" onPress={onDigit} isDisabled={isDisabled} />
				<Pressable
					onPress={handleSubmit}
					disabled={isDisabled || !canSubmit}
					className="w-20 h-20 rounded-full items-center justify-center active:bg-surface"
				>
					<ArrowRightFromLine size={24} color={canSubmit ? foreground : muted} />
				</Pressable>
			</View>
		</View>
	);
}
