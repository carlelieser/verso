import { Menu } from 'heroui-native';
import type { LucideIcon } from 'lucide-react-native';
import React from 'react';

import { useThemeColors } from '@/hooks/use-theme-colors';

const MENU_ICON_SIZE = 16;

interface PopoverMenuItem {
	readonly id: string;
	readonly label: string;
	readonly icon?: LucideIcon | React.ReactNode;
	readonly variant?: 'default' | 'danger';
	readonly onPress: () => void;
}

interface PopoverMenuProps {
	readonly trigger: React.ReactNode;
	readonly items: readonly PopoverMenuItem[];
	readonly width?: number;
	readonly placement?: 'top' | 'bottom' | 'left' | 'right';
	readonly offset?: number;
	readonly alignOffset?: number;
}

export type { PopoverMenuItem };

export function PopoverMenu({
	trigger,
	items,
	width = 200,
	placement,
	offset,
	alignOffset,
}: PopoverMenuProps): React.JSX.Element | null {
	const { muted, danger } = useThemeColors();

	if (items.length === 0) return null;

	return (
		<Menu presentation="popover">
			<Menu.Trigger asChild>{trigger}</Menu.Trigger>
			<Menu.Portal>
				<Menu.Overlay />
				<Menu.Content presentation="popover" width={width} placement={placement} offset={offset} alignOffset={alignOffset}>
					{items.map((item) => {
						const color = item.variant === 'danger' ? danger : muted;
						const icon =
							item.icon && typeof item.icon === 'function'
								? React.createElement(item.icon as LucideIcon, {
										size: MENU_ICON_SIZE,
										color,
									})
								: (item.icon ?? null);

						return (
							<Menu.Item
								key={item.id}
								id={item.id}
								variant={item.variant}
								shouldCloseOnSelect
								onPress={item.onPress}
							>
								{icon}
								<Menu.ItemTitle>{item.label}</Menu.ItemTitle>
							</Menu.Item>
						);
					})}
				</Menu.Content>
			</Menu.Portal>
		</Menu>
	);
}
