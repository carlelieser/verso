import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Bell, MapPin, Mic } from 'lucide-react-native';
import React, { useCallback, useRef } from 'react';

import {
	type OnboardingPage,
	type OnboardingPagerHandle,
	OnboardingPager,
} from '@/components/onboarding/onboarding-pager';
import {
	type PermissionItem,
	PermissionsContent,
} from '@/components/onboarding/permissions-content';
import { VoiceInputContent } from '@/components/onboarding/voice-input-content';
import { WelcomeContent } from '@/components/onboarding/welcome-content';
import { SETTINGS_AUTO_LOCATION_KEY, SETTINGS_ONBOARDING_COMPLETE_KEY } from '@/constants/settings';
import { usePermissions } from '@/hooks/use-permissions';

async function completeOnboarding(locationGranted: boolean): Promise<void> {
	await Promise.all([
		SecureStore.setItemAsync(SETTINGS_ONBOARDING_COMPLETE_KEY, 'true'),
		SecureStore.setItemAsync(SETTINGS_AUTO_LOCATION_KEY, String(locationGranted)),
	]);
	router.replace('/');
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

	const handleComplete = useCallback(() => {
		completeOnboarding(permissions.location.status === 'granted');
	}, [permissions.location.status]);

	const handleSetup = useCallback(async () => {
		await permissions.notification.request();
		const locationGranted = await permissions.location.request();
		await permissions.microphone.request();
		completeOnboarding(locationGranted);
	}, [permissions]);

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
				label: allGranted ? 'Next' : 'Setup',
				onPress: allGranted ? () => pagerRef.current?.goToNext() : handleSetup,
			},
			secondaryAction: { label: 'Skip', onPress: () => pagerRef.current?.goToNext() },
		},
		{
			key: 'voice-input',
			content: <VoiceInputContent />,
			cta: {
				label: 'Get Started',
				onPress: handleComplete,
			},
			secondaryAction: { label: 'Skip', onPress: handleComplete },
		},
	];

	return <OnboardingPager ref={pagerRef} pages={pages} />;
}
