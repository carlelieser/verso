import { Redirect } from 'expo-router';
import React from 'react';

import { SETTINGS_ONBOARDING_COMPLETE_KEY } from '@/constants/settings';
import { storage } from '@/services/storage';

function isOnboardingDone(): boolean {
	return storage.get(SETTINGS_ONBOARDING_COMPLETE_KEY, false);
}

export default function RootIndex(): React.JSX.Element {
	if (!isOnboardingDone()) {
		return <Redirect href="/onboarding" />;
	}
	return <Redirect href="/journals" />;
}
