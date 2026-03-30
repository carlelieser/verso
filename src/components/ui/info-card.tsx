import React from 'react';
import { View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

interface InfoCardProps {
	readonly children: React.ReactNode;
	readonly style?: StyleProp<ViewStyle>;
}

export function InfoCard({ children, style }: InfoCardProps): React.JSX.Element {
	return (
		<View
			className="flex-row items-center gap-3 p-3 rounded-xl bg-surface border border-border"
			style={style}
		>
			{children}
		</View>
	);
}
