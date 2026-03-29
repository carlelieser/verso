import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Bell, Check, MapPin, Mic } from 'lucide-react-native';
import React, { useCallback, useRef } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

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
import { type Permission, usePermissions } from '@/hooks/use-permissions';
import { useThemeColors } from '@/hooks/use-theme-colors';

const ICON = require('../../assets/images/icon.png') as number;

interface PermissionItem {
	readonly label: string;
	readonly description: string;
	readonly icon: React.ComponentType<{ size: number; color: string }>;
	readonly permission: Permission;
}

async function completeOnboarding(permissions: ReturnType<typeof usePermissions>): Promise<void> {
	await Promise.all([
		SecureStore.setItemAsync(SETTINGS_ONBOARDING_COMPLETE_KEY, 'true'),
		SecureStore.setItemAsync(
			SETTINGS_AUTO_LOCATION_KEY,
			String(permissions.location.status === 'granted'),
		),
		SecureStore.setItemAsync(
			SETTINGS_TRANSCRIPTION_KEY,
			String(permissions.microphone.status === 'granted'),
		),
	]);
	router.replace('/');
}

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
	readonly items: readonly PermissionItem[];
}

function PermissionsContent({ items }: PermissionsContentProps): React.JSX.Element {
	const { background, muted } = useThemeColors();

	return (
		<View className="flex-1 justify-center px-8">
			<Text className="text-3xl font-heading text-foreground mb-2">Set up permissions</Text>
			<Text className="text-base text-muted mb-8">
				These are optional. You can change them later in Settings.
			</Text>

			<View className="gap-4">
				{items.map((item) => {
					const isGranted = item.permission.status === 'granted';
					const IconComponent = item.icon;

					return (
						<Pressable
							key={item.label}
							onPress={() => !isGranted && item.permission.request()}
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
						</Pressable>
					);
				})}
			</View>
		</View>
	);
}

export default function OnboardingScreen(): React.JSX.Element {
	const permissions = usePermissions();
	const pagerRef = useRef<OnboardingPagerHandle>(null);

	const items: readonly PermissionItem[] = [
		{
			label: 'Notifications',
			description: 'Reminders',
			icon: Bell,
			permission: permissions.notification,
		},
		{
			label: 'Location',
			description: 'Location-tagging',
			icon: MapPin,
			permission: permissions.location,
		},
		{
			label: 'Microphone',
			description: 'Speech-to-text (STT)',
			icon: Mic,
			permission: permissions.microphone,
		},
	];

	const allGranted = items.every((item) => item.permission.status === 'granted');

	const handleSetup = useCallback(async () => {
		for (const item of items) {
			if (item.permission.status !== 'granted') {
				await item.permission.request();
			}
		}
		await completeOnboarding(permissions);
	}, [items, permissions]);

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
			content: <PermissionsContent items={items} />,
			cta: {
				label: allGranted ? 'Get Started' : 'Setup',
				onPress: allGranted ? () => completeOnboarding(permissions) : handleSetup,
			},
			secondaryAction: { label: 'Skip', onPress: () => completeOnboarding(permissions) },
		},
	];

	return <OnboardingPager ref={pagerRef} pages={pages} />;
}
