import { Button, Menu } from 'heroui-native';
import { EllipsisVertical } from 'lucide-react-native';
import React from 'react';

import { useThemeColors } from '@/hooks/use-theme-colors';

export interface OverflowMenuItem {
	readonly id: string;
	readonly label: string;
	readonly icon?: React.ReactNode;
	readonly onPress: () => void;
}

interface OverflowMenuProps {
	readonly items: readonly OverflowMenuItem[];
}

export function OverflowMenu({ items }: OverflowMenuProps): React.JSX.Element | null {
	const { muted } = useThemeColors();

	if (items.length === 0) return null;

	return (
		<Menu presentation="popover">
			<Menu.Trigger asChild>
				<Button variant="ghost" size="sm" isIconOnly>
					<EllipsisVertical size={16} color={muted} />
				</Button>
			</Menu.Trigger>
			<Menu.Portal>
				<Menu.Overlay />
				<Menu.Content presentation="popover" width={200}>
					{items.map((item) => (
						<Menu.Item
							key={item.id}
							id={item.id}
							shouldCloseOnSelect
							onPress={item.onPress}
						>
							{item.icon ?? null}
							<Menu.ItemTitle>{item.label}</Menu.ItemTitle>
						</Menu.Item>
					))}
				</Menu.Content>
			</Menu.Portal>
		</Menu>
	);
}
