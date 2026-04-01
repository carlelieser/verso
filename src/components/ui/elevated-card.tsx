import { Card, type CardRootProps } from 'heroui-native';
import React from 'react';

export type Elevation = 0 | 1 | 2 | 3;

export interface ElevatedCardProps extends CardRootProps {
	readonly elevation?: Elevation;
}

const SHADOW_CLASSES: Record<Elevation, string> = {
	0: '',
	1: 'shadow-sm',
	2: 'shadow-md',
	3: 'shadow-xl',
};

const TINT_CLASSES: Record<Elevation, string> = {
	0: '',
	1: 'bg-white/5',
	2: 'bg-white/10',
	3: 'bg-white/15',
};

export function ElevatedCard({
	elevation = 0,
	children,
	className,
	...rest
}: ElevatedCardProps): React.JSX.Element {
	const shadow = SHADOW_CLASSES[elevation];
	const tint = TINT_CLASSES[elevation];

	return (
		<Card className={`${tint} ${shadow} ${className ?? ''}`} {...rest}>
			{children}
		</Card>
	);
}
