import { type ButtonVariant, Menu } from 'heroui-native';
import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { Fab } from '@/components/fab';

interface FabMenuItem {
	readonly id: string;
	readonly label: string;
	readonly icon?: React.ReactNode;
	readonly variant?: 'default' | 'danger';
	readonly onPress: () => void;
}

interface FabMenuProps {
	readonly icon: React.ReactNode;
	readonly items: readonly FabMenuItem[];
	readonly fabVariant?: ButtonVariant;
	readonly className?: string;
	readonly style?: StyleProp<ViewStyle>;
}

export type { FabMenuItem };

export function FabMenu({
	icon,
	items,
	fabVariant = 'secondary',
	className,
	style,
}: FabMenuProps): React.JSX.Element {
	return (
		<Menu presentation="popover">
			<Menu.Trigger asChild>
				<Fab
					variant={fabVariant}
					icon={icon}
					className={className}
					style={style}
				/>
			</Menu.Trigger>
			<Menu.Portal>
				<Menu.Overlay />
				<Menu.Content presentation="popover" placement="top" width={200}>
					{items.map((item) => (
						<Menu.Item
							key={item.id}
							id={item.id}
							variant={item.variant}
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
