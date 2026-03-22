import '../global.css';

import {useFonts as useDMSerif} from '@expo-google-fonts/dm-serif-display';
import {useFonts as useGoogleSans} from '@expo-google-fonts/google-sans-flex';
import {useFonts as useLibreBaskerville} from '@expo-google-fonts/libre-baskerville';
import {Stack} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {StatusBar} from 'expo-status-bar';
import React, {useEffect} from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';

import {HeroUINativeProvider} from 'heroui-native';

import {DatabaseProvider} from '@/providers/database-provider';

SplashScreen.preventAutoHideAsync();

export default function RootLayout(): React.JSX.Element {
	const [dmSerifLoaded] = useDMSerif({
		DMSerifDisplay_400Regular: require('@expo-google-fonts/dm-serif-display/400Regular/DMSerifDisplay_400Regular.ttf'),
	});

	const [googleSansLoaded] = useGoogleSans({
		GoogleSansFlex_400Regular: require('@expo-google-fonts/google-sans-flex/400Regular/GoogleSansFlex_400Regular.ttf'),
		GoogleSansFlex_500Medium: require('@expo-google-fonts/google-sans-flex/500Medium/GoogleSansFlex_500Medium.ttf'),
		GoogleSansFlex_600SemiBold: require('@expo-google-fonts/google-sans-flex/600SemiBold/GoogleSansFlex_600SemiBold.ttf'),
		GoogleSansFlex_700Bold: require('@expo-google-fonts/google-sans-flex/700Bold/GoogleSansFlex_700Bold.ttf'),
	});

	const [libreBaskervilleLoaded] = useLibreBaskerville({
		LibreBaskerville_400Regular: require('@expo-google-fonts/libre-baskerville/400Regular/LibreBaskerville_400Regular.ttf'),
		LibreBaskerville_400Regular_Italic: require('@expo-google-fonts/libre-baskerville/400Regular_Italic/LibreBaskerville_400Regular_Italic.ttf'),
		LibreBaskerville_700Bold: require('@expo-google-fonts/libre-baskerville/700Bold/LibreBaskerville_700Bold.ttf'),
	});

	const fontsLoaded = dmSerifLoaded && googleSansLoaded && libreBaskervilleLoaded;

	useEffect(() => {
		if (fontsLoaded) {
			SplashScreen.hideAsync();
		}
	}, [fontsLoaded]);

	if (!fontsLoaded) {
		return <></>;
	}

	return (
		<GestureHandlerRootView className="flex-1 bg-background">
			<HeroUINativeProvider>
				<DatabaseProvider>
					<Stack screenOptions={{
						headerShown: false,
					}}/>
				</DatabaseProvider>
				<StatusBar style="auto"/>
			</HeroUINativeProvider>
		</GestureHandlerRootView>
	);
}
