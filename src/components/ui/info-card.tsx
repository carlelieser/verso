import React from 'react';
import { View } from 'react-native';
import type { ViewProps } from 'react-native';

interface InfoCardProps extends ViewProps {
	readonly children: React.ReactNode;
}

export function InfoCard({ children, className, ...rest }: InfoCardProps): React.JSX.Element {
	return (
		<View
			className={`flex-row items-center gap-3 p-3 rounded-xl bg-surface border border-border ${className ?? ''}`}
			{...rest}
		>
			{children}
		</View>
	);
}
