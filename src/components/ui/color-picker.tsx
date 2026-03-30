import { Check } from 'lucide-react-native';
import React from 'react';
import { Pressable, View } from 'react-native';

import { useThemeColors } from '@/hooks/use-theme-colors';

const DEFAULT_SWATCHES = [
	'#D94848', // red
	'#D97B48', // orange
	'#D9C248', // gold
	'#6BBF6B', // green
	'#48A5D9', // blue
	'#6B6BD9', // indigo
	'#A66BD9', // violet
	'#D96BA6', // pink
	'#8C7A6B', // brown
	'#7A8A8C', // slate
] as const;

interface ColorPickerProps {
	readonly value: string;
	readonly onChange: (color: string) => void;
	readonly colors?: readonly string[];
}

export function ColorPicker({
	value,
	onChange,
	colors = DEFAULT_SWATCHES,
}: ColorPickerProps): React.JSX.Element {
	const { foreground } = useThemeColors();

	return (
		<View className="flex-row flex-wrap gap-3">
			{colors.map((color) => {
				const isSelected = value === color;
				return (
					<Pressable
						key={color}
						onPress={() => onChange(color)}
						className="size-10 rounded-full items-center justify-center"
						style={{ backgroundColor: color }}
					>
						{isSelected && (
							<View className="size-10 rounded-full items-center justify-center bg-black/30">
								<Check size={18} color={foreground} strokeWidth={3} />
							</View>
						)}
					</Pressable>
				);
			})}
		</View>
	);
}
