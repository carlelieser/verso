import type { ButtonVariant } from 'heroui-native';
import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { Fab } from '@/components/ui/fab';
import { PopoverMenu, type PopoverMenuItem } from '@/components/ui/popover-menu';

export type FabMenuItem = PopoverMenuItem;

interface FabMenuProps {
	readonly icon: React.ReactNode;
	readonly items: readonly FabMenuItem[];
	readonly fabVariant?: ButtonVariant;
	readonly className?: string;
	readonly style?: StyleProp<ViewStyle>;
}

export function FabMenu({
	icon,
	items,
	fabVariant = 'secondary',
	className,
	style,
}: FabMenuProps): React.JSX.Element | null {
	if (items.length === 0) return null;

	return (
		<PopoverMenu
			trigger={<Fab variant={fabVariant} icon={icon} className={className} style={style} />}
			items={items}
			placement="top"
		/>
	);
}
