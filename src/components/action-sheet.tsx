import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Button, Separator } from 'heroui-native';
import { type LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

import { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface ActionSheetItem {
	readonly id: string;
	readonly label: string;
	readonly icon?: LucideIcon;
	readonly variant?: 'default' | 'danger';
	readonly onPress: () => void;
}

interface ActionSheetProps {
	readonly header?: React.ReactNode;
	readonly items: readonly ActionSheetItem[];
	readonly sheet: ReturnType<typeof useBottomSheet>;
}

export type { ActionSheetItem };

export function ActionSheet({ header, items, sheet }: ActionSheetProps): React.JSX.Element | null {
	const { danger, foreground } = useThemeColors();

	if (!sheet.isOpen) return null;

	return (
		<BottomSheet ref={sheet.ref} {...sheet.sheetProps}>
			<BottomSheetView className="px-4 pb-4 gap-2">
				{header ? <View pointerEvents="none">{header}</View> : null}
				<Separator />
				{items.map((item) => {
					const isDanger = item.variant === 'danger';
					const color = isDanger ? danger : foreground;
					const Icon = item.icon;

					return (
						<Button
							key={item.id}
							variant="ghost"
							onPress={() => {
								sheet.close();
								item.onPress();
							}}
							className="justify-start"
						>
							{Icon ? <Icon size={18} color={color} /> : null}
							<Text
								className={`text-base ${isDanger ? 'text-danger' : 'text-foreground'}`}
							>
								{item.label}
							</Text>
						</Button>
					);
				})}
			</BottomSheetView>
		</BottomSheet>
	);
}
