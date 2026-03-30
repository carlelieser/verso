import React from 'react';
import { Pressable, Text } from 'react-native';

type PillVariant = 'pill' | 'tile';

interface SelectablePillProps {
	readonly label: string;
	readonly isSelected: boolean;
	readonly onPress: () => void;
	readonly variant?: PillVariant;
	readonly className?: string;
}

const RADIUS: Record<PillVariant, string> = {
	pill: 'rounded-full',
	tile: 'rounded-xl',
};

export function SelectablePill({
	label,
	isSelected,
	onPress,
	variant = 'pill',
	className,
}: SelectablePillProps): React.JSX.Element {
	const radius = RADIUS[variant];
	const bg = isSelected ? 'bg-accent border-accent' : 'bg-surface border-border';
	const textColor = isSelected ? 'text-accent-foreground font-semibold' : 'text-foreground';

	return (
		<Pressable onPress={onPress} className={`border ${radius} ${bg} ${className ?? ''}`}>
			<Text className={`text-sm ${textColor}`}>{label}</Text>
		</Pressable>
	);
}
