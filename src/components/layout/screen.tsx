import { router } from 'expo-router';
import { Button } from 'heroui-native';
import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '@/hooks/use-theme-colors';

interface ScreenProps {
	/** Content rendered above the header row (e.g. a color banner). */
	readonly headerAbove?: React.ReactNode;
	/** Heading content — string for plain text, ReactNode for custom layout (e.g. icon + text). */
	readonly title?: React.ReactNode;
	/** Show back button with ChevronLeft icon. Defaults to true. */
	readonly showBackButton?: boolean;
	/** Disable the top safe area inset. Useful when content bleeds to the screen edge. */
	readonly disableTopInset?: boolean;
	/** Slot for right-side header actions. */
	readonly headerRight?: React.ReactNode;
	readonly children: React.ReactNode;
}

export function Screen({
	headerAbove,
	title,
	showBackButton = true,
	disableTopInset = false,
	headerRight,
	children,
}: ScreenProps): React.JSX.Element {
	const insets = useSafeAreaInsets();
	const { muted } = useThemeColors();

	return (
		<View
			className="flex-1 bg-background"
			style={{ paddingTop: disableTopInset ? 0 : insets.top }}
		>
			{headerAbove ?? null}
			<View className="p-3 gap-1">
				<View className="flex-row items-center justify-between">
					{showBackButton ? (
						<Button variant="ghost" size="sm" isIconOnly onPress={() => router.back()}>
							<ChevronLeft size={20} color={muted} />
						</Button>
					) : null}
					{headerRight ?? null}
				</View>
				{title !== undefined ? (
					typeof title === 'string' ? (
						<Text className="text-5xl font-heading text-foreground ml-2 pb-2">
							{title}
						</Text>
					) : (
						<View className="ml-2 pb-2">{title}</View>
					)
				) : null}
			</View>
			{children}
		</View>
	);
}
