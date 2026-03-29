import { requestRecordingPermissionsAsync } from 'expo-audio';
import * as ExpoLocation from 'expo-location';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Bell, Check, MapPin, Mic } from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import { Image, Text, View } from 'react-native';

import {
	type OnboardingPage,
	type OnboardingPagerHandle,
	OnboardingPager,
} from '@/components/onboarding-pager';
import {
	SETTINGS_AUTO_LOCATION_KEY,
	SETTINGS_ONBOARDING_COMPLETE_KEY,
	SETTINGS_TRANSCRIPTION_KEY,
} from '@/constants/settings';
import { useThemeColors } from '@/hooks/use-theme-colors';

const ICON = require('../../assets/images/icon.png') as number;

type PermissionKey = 'notifications' | 'location' | 'microphone';

interface PermissionItem {
	readonly key: PermissionKey;
	readonly label: string;
	readonly description: string;
	readonly icon: React.ComponentType<{ size: number; color: string }>;
}

const PERMISSIONS: readonly PermissionItem[] = [
	{
		key: 'notifications',
		label: 'Notifications',
		description: 'Daily journaling reminders',
		icon: Bell,
	},
	{
		key: 'location',
		label: 'Location',
		description: 'Tag entries with where you are',
		icon: MapPin,
	},
	{
		key: 'microphone',
		label: 'Microphone',
		description: 'Voice-to-text for hands-free writing',
		icon: Mic,
	},
];

async function requestPermission(key: PermissionKey): Promise<boolean> {
	switch (key) {
		case 'notifications': {
			const { status } = await Notifications.requestPermissionsAsync();
			return status === 'granted';
		}
		case 'location': {
			const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
			return status === ExpoLocation.PermissionStatus.GRANTED;
		}
		case 'microphone': {
			const { granted } = await requestRecordingPermissionsAsync();
			return granted;
		}
	}
}

async function completeOnboarding(granted: Record<PermissionKey, boolean>): Promise<void> {
	await Promise.all([
		SecureStore.setItemAsync(SETTINGS_ONBOARDING_COMPLETE_KEY, 'true'),
		SecureStore.setItemAsync(SETTINGS_AUTO_LOCATION_KEY, String(granted.location)),
		SecureStore.setItemAsync(SETTINGS_TRANSCRIPTION_KEY, String(granted.microphone)),
	]);
	router.replace('/');
}

// -- Page content components --------------------------------------------------

function WelcomeContent(): React.JSX.Element {
	return (
		<View className="flex-1 items-center justify-center px-8">
			<Image source={ICON} className="w-28 h-28 mb-6 rounded-full" resizeMode="contain" />
			<Text className="text-5xl font-heading text-foreground text-center">Verso</Text>
			<Text className="text-lg text-muted text-center mt-3">
				Your private space to reflect, capture moments, and check in with yourself.
			</Text>
		</View>
	);
}

interface PermissionsContentProps {
	readonly granted: Record<PermissionKey, boolean>;
}

function PermissionsContent({ granted }: PermissionsContentProps): React.JSX.Element {
	const { background, muted } = useThemeColors();

	return (
		<View className="flex-1 justify-center px-8">
			<Text className="text-3xl font-heading text-foreground mb-2">Set up permissions</Text>
			<Text className="text-base text-muted mb-8">
				These are optional. You can change them later in Settings.
			</Text>

			<View className="gap-4">
				{PERMISSIONS.map((item) => {
					const isGranted = granted[item.key];
					const IconComponent = item.icon;

					return (
						<View
							key={item.key}
							className={`flex-row items-center gap-4 rounded-xl px-4 py-4 ${isGranted ? 'bg-foreground' : 'bg-surface'}`}
						>
							<View
								className={`w-10 h-10 rounded-full items-center justify-center ${isGranted ? 'bg-background/5' : 'bg-foreground/5'}`}
							>
								<IconComponent size={20} color={isGranted ? background : muted} />
							</View>
							<View className="flex-1">
								<Text
									className={`text-base font-medium ${isGranted ? 'text-background' : 'text-foreground'}`}
								>
									{item.label}
								</Text>
								<Text
									className={`text-sm ${isGranted ? 'text-background/60' : 'text-muted'}`}
								>
									{item.description}
								</Text>
							</View>
							{isGranted ? <Check size={20} color={background} /> : null}
						</View>
					);
				})}
			</View>
		</View>
	);
}

// -- Screen -------------------------------------------------------------------

export default function OnboardingScreen(): React.JSX.Element {
	const [granted, setGranted] = useState<Record<PermissionKey, boolean>>({
		notifications: false,
		location: false,
		microphone: false,
	});
	const pagerRef = useRef<OnboardingPagerHandle>(null);

	const allGranted = PERMISSIONS.every((p) => granted[p.key]);

	const handleSetup = useCallback(async () => {
		const results = { ...granted };
		for (const permission of PERMISSIONS) {
			const result = await requestPermission(permission.key);
			results[permission.key] = result;
			setGranted((prev) => ({ ...prev, [permission.key]: result }));
		}
		await completeOnboarding(results);
	}, [granted]);

	const pages: readonly OnboardingPage[] = [
		{
			key: 'welcome',
			content: <WelcomeContent />,
			cta: {
				label: 'Next',
				onPress: () => pagerRef.current?.goToNext(),
			},
		},
		{
			key: 'permissions',
			content: <PermissionsContent granted={granted} />,
			cta: {
				label: allGranted ? 'Get Started' : 'Setup',
				onPress: allGranted ? () => completeOnboarding(granted) : handleSetup,
			},
			secondaryAction: { label: 'Skip', onPress: () => completeOnboarding(granted) },
		},
	];

	return <OnboardingPager ref={pagerRef} pages={pages} />;
}
