import { Button } from 'heroui-native';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react-native';
import React, { useMemo } from 'react';

import { PopoverMenu, type PopoverMenuItem } from '@/components/ui/popover-menu';
import type { UseSortResult } from '@/hooks/use-sort';
import { useThemeColors } from '@/hooks/use-theme-colors';

const TRIGGER_ICON_SIZE = 16;

interface SortMenuProps<T> {
	readonly sort: UseSortResult<T>;
}

export function SortMenu<T>({ sort }: SortMenuProps<T>): React.JSX.Element {
	const { foreground } = useThemeColors();
	const activeArrow = sort.sortDirection === 'asc' ? ArrowUp : ArrowDown;

	const items = useMemo<readonly PopoverMenuItem[]>(
		() =>
			sort.options.map((option) => ({
				id: option.key,
				label: option.label,
				iconEnd: option.key === sort.sortKey ? activeArrow : undefined,
				onPress: () => {
					if (option.key === sort.sortKey) {
						sort.toggleDirection();
					} else {
						sort.setSortKey(option.key);
					}
				},
			})),
		[sort, activeArrow],
	);

	return (
		<PopoverMenu
			trigger={
				<Button variant="ghost" isIconOnly>
					<ArrowUpDown size={TRIGGER_ICON_SIZE} color={foreground} />
				</Button>
			}
			items={items}
			placement="bottom"
			alignOffset={-8}
		/>
	);
}
