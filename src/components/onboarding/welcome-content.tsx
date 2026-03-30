import React from 'react';
import { Image, Text, View } from 'react-native';

const ICON = require('../../../assets/images/icon.png') as number;

export function WelcomeContent(): React.JSX.Element {
	return (
		<View className="flex-1 items-center justify-center px-8">
			<Image source={ICON} className="size-36 mb-6 rounded-full" resizeMode="contain" />
			<Text className="text-5xl font-heading text-foreground text-center">Welcome</Text>
			<Text className="text-lg text-muted text-center mt-3">
				Verso is your private space to reflect, capture moments, and check in with yourself.
			</Text>
		</View>
	);
}
