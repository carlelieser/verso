import { CloudSun } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

import { useThemeColors } from '@/hooks/use-theme-colors';
import type { Weather } from '@/types/weather';

interface WeatherCardProps {
	readonly weather: Weather;
}

export function WeatherCard({ weather }: WeatherCardProps): React.JSX.Element {
	const { muted } = useThemeColors();

	return (
		<View className="p-3 rounded-xl bg-surface border border-border flex-row items-center gap-3">
			<CloudSun size={20} color={muted} />
			<Text className="text-sm text-foreground">
				{Math.round(weather.temperature)}°F {weather.condition}
			</Text>
		</View>
	);
}
