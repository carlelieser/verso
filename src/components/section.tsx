import React from 'react';
import { View } from 'react-native';

import { Overline } from '@/components/overline';

interface SectionProps {
	readonly label: string;
	readonly children: React.ReactNode;
}

export function Section({ label, children }: SectionProps): React.JSX.Element {
	return (
		<View className="flex flex-col gap-2 mb-4">
			<Overline>{label}</Overline>
			{children}
		</View>
	);
}
