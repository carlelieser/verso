import React from 'react';
import { Text, View } from 'react-native';

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
	return (
		<View className="flex-1 items-center justify-center px-8 py-16">
			<View className="p-8 rounded-full bg-foreground/5 flex items-center justify-center">
				{icon}
			</View>
			<Text className="text-3xl font-heading text-foreground text-center mt-4">{title}</Text>
			{description !== undefined ? (
				<Text className="text-center text-muted mt-2">{description}</Text>
			) : null}
			{action !== undefined ? <View className="mt-4">{action}</View> : null}
		</View>
	);
}
