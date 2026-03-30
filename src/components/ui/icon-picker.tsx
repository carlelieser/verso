import React from 'react';
import { Pressable, View } from 'react-native';

import { useThemeColors } from '@/hooks/use-theme-colors';

interface IconDefinition {
	readonly key: string;
	readonly Icon: React.ComponentType<{ size?: number; color?: string }>;
}

interface IconPickerProps {
	readonly icons: readonly IconDefinition[];
	readonly selectedKey: string;
	readonly onSelect: (key: string) => void;
}

export function IconPicker({ icons, selectedKey, onSelect }: IconPickerProps): React.JSX.Element {
	const { accentForeground, muted } = useThemeColors();

	return (
		<View className="flex-row flex-wrap gap-2">
			{icons.map(({ key, Icon }) => {
				const isSelected = selectedKey === key;
				return (
					<Pressable
						key={key}
						onPress={() => onSelect(key)}
						className={`size-11 rounded-xl items-center justify-center border ${
							isSelected ? 'bg-accent border-accent' : 'bg-transparent border-border'
						}`}
					>
						<Icon size={20} color={isSelected ? accentForeground : muted} />
					</Pressable>
				);
			})}
		</View>
	);
}
