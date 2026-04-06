import { Button } from 'heroui-native';
import { ArrowUpRight } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { Linking } from 'react-native';

import { useThemeColors } from '@/hooks/use-theme-colors';

interface LinkButtonProps {
	readonly href: string;
	readonly children: string;
}

export function LinkButton({ href, children }: LinkButtonProps): React.JSX.Element {
	const { accentForeground } = useThemeColors();

	const handlePress = useCallback(() => {
		Linking.openURL(href);
	}, [href]);

	return (
		<Button onPress={handlePress}>
			<Button.Label>{children}</Button.Label>
			<ArrowUpRight size={16} color={accentForeground} />
		</Button>
	);
}
