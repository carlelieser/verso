import React from 'react';
import { Text } from 'react-native';

interface OverlineProps {
	readonly children: string;
}

export function Overline({ children }: OverlineProps): React.JSX.Element {
	return (
		<Text
			className="text-muted font-medium uppercase"
			style={{ fontSize: 11, letterSpacing: 3 }}
		>
			{children}
		</Text>
	);
}
