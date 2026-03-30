import { Button } from 'heroui-native';
import { EllipsisVertical } from 'lucide-react-native';
import React from 'react';

import { PopoverMenu, type PopoverMenuItem } from '@/components/ui/popover-menu';
import { useThemeColors } from '@/hooks/use-theme-colors';

export type OverflowMenuItem = PopoverMenuItem;

interface OverflowMenuProps {
	readonly items: readonly OverflowMenuItem[];
}

export function OverflowMenu({ items }: OverflowMenuProps): React.JSX.Element | null {
	const { muted } = useThemeColors();

	if (items.length === 0) return null;

	return (
		<PopoverMenu
			trigger={
				<Button variant="ghost" size="sm" isIconOnly>
					<EllipsisVertical size={16} color={muted} />
				</Button>
			}
			items={items}
		/>
	);
}
