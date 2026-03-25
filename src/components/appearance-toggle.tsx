import { Button } from 'heroui-native';
import { Moon, Sun } from 'lucide-react-native';
import React from 'react';
import { Uniwind, useUniwind } from 'uniwind';

import { useThemeColors } from '@/hooks/use-theme-colors';

export function AppearanceToggle(): React.JSX.Element {
	const { theme } = useUniwind();
	const { muted } = useThemeColors();
	const isDark = theme === 'dark';

	return (
		<Button
			variant="ghost"
			size="sm"
			isIconOnly
			onPress={() => Uniwind.setTheme(isDark ? 'light' : 'dark')}
		>
			{isDark ? <Sun size={16} color={muted} /> : <Moon size={16} color={muted} />}
		</Button>
	);
}
