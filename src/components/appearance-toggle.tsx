import {Moon, Sun} from 'lucide-react-native';
import React from 'react';
import {Uniwind, useCSSVariable, useUniwind} from 'uniwind';

import {Button} from 'heroui-native';

export function AppearanceToggle(): React.JSX.Element {
	const {theme} = useUniwind();
	const [muted] = useCSSVariable(['--color-muted']);
	const isDark = theme === 'dark';

	return (
		<Button variant="ghost" size="sm" isIconOnly onPress={() => Uniwind.setTheme(isDark ? 'light' : 'dark')}>
			{isDark ? <Sun size={16} color={muted as string}/> : <Moon size={16} color={muted as string}/>}
		</Button>
	);
}
