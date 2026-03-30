import { CloudSun } from 'lucide-react-native';
import React from 'react';
import { Text } from 'react-native';

import { InfoCard } from '@/components/ui/info-card';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { Weather } from '@/types/weather';

interface WeatherCardProps {
	readonly weather: Weather;
}

export function WeatherCard({ weather }: WeatherCardProps): React.JSX.Element {
	const { muted } = useThemeColors();

	return (
		<InfoCard>
			<CloudSun size={20} color={muted} />
			<Text className="text-sm text-foreground">
				{Math.round(weather.temperature)}°F {weather.condition}
			</Text>
		</InfoCard>
	);
}
