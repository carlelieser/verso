import React from 'react';
import { Text, View } from 'react-native';

import { useThemeColors } from '@/hooks/use-theme-colors';

interface EmptyStateProps {
	readonly icon: React.ReactNode;
	readonly title: string;
	readonly description?: string;
	readonly action?: React.ReactNode;
}

export function EmptyState({
	icon,
	title,
	description,
	action,
}: EmptyStateProps): React.JSX.Element {
	const { muted } = useThemeColors();

	return (
		<View className="flex-1 items-center justify-center px-8 py-16">
			<View className="p-4 rounded-full bg-foreground/5 flex items-center justify-center">
				{icon}
			</View>
			<Text className="text-lg text-foreground text-center mt-2">{title}</Text>
			{description !== undefined ? (
				<Text className="text-center mt-1" style={{ color: muted }}>
					{description}
				</Text>
			) : null}
			{action !== undefined ? <View className="mt-2">{action}</View> : null}
		</View>
	);
}
