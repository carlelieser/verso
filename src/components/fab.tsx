import { Button } from 'heroui-native';
import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

interface FabProps {
	readonly icon: React.ReactNode;
	readonly onPress: () => void;
	readonly className?: string;
	readonly style?: StyleProp<ViewStyle>;
}

export function Fab({ icon, onPress, className, style }: FabProps): React.JSX.Element {
	return (
		<Button
			variant="primary"
			size="lg"
			isIconOnly
			onPress={onPress}
			className={`size-18 rounded-full shadow-2xl ${className ?? ''}`}
			style={style}
		>
			{icon}
		</Button>
	);
}
