import React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SheetContentProps {
	readonly title?: string;
	readonly footer?: React.ReactNode;
	readonly children: React.ReactNode;
}

export function SheetContent({ title, footer, children }: SheetContentProps): React.JSX.Element {
	const { bottom } = useSafeAreaInsets();

	return (
		<View className="p-6 gap-6" style={{ paddingBottom: bottom + 16 }}>
			{title ? (
				<Text className="text-3xl font-heading text-foreground pb-1">{title}</Text>
			) : null}
			{children}
			{footer ? <View className="flex-row items-center justify-end">{footer}</View> : null}
		</View>
	);
}
