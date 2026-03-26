import { Button } from 'heroui-native';
import React, { forwardRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { View } from 'react-native';

interface FabProps {
	readonly icon: React.ReactNode;
	readonly onPress?: () => void;
	readonly className?: string;
	readonly style?: StyleProp<ViewStyle>;
}

export const Fab = forwardRef<View, FabProps>(function Fab({ icon, onPress, className, style }, ref) {
	return (
		<Button
			ref={ref}
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
});
