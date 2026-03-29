import { Redirect, router, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { BookOpen, History, Settings } from 'lucide-react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import {
	type EntryComposerHandle,
	EntryComposer,
	type OverflowMenuItem,
} from '@/components/entry/entry-composer';
import { EntrySaved } from '@/components/entry/entry-saved';
import { SETTINGS_ONBOARDING_COMPLETE_KEY } from '@/constants/settings';
import { useThemeColors } from '@/hooks/use-theme-colors';

function isOnboardingDone(): boolean {
	return SecureStore.getItem(SETTINGS_ONBOARDING_COMPLETE_KEY) === 'true';
}

function HomeContent(): React.JSX.Element {
	const { journalId } = useLocalSearchParams<{ journalId?: string }>();
	const { muted } = useThemeColors();
	const [showSaved, setShowSaved] = useState(false);
	const composerRef = useRef<EntryComposerHandle>(null);

	const handleFinish = useCallback(() => {
		composerRef.current?.clear();
		setShowSaved(true);
	}, []);

	const handleSavedComplete = useCallback(() => {
		setShowSaved(false);
	}, []);

	const overflowItems: readonly OverflowMenuItem[] = useMemo(
		() => [
			{
				id: 'journals',
				label: 'Journals',
				icon: <BookOpen size={16} color={muted} />,
				onPress: () => router.push('/journals'),
			},
			{
				id: 'history',
				label: 'History',
				icon: <History size={16} color={muted} />,
				onPress: () => router.push('/history'),
			},
			{
				id: 'settings',
				label: 'Settings',
				icon: <Settings size={16} color={muted} />,
				onPress: () => router.push('/settings'),
			},
		],
		[muted],
	);

	return (
		<View className="flex-1 bg-background">
			<EntryComposer
				ref={composerRef}
				initialJournalId={journalId}
				isAnimatedCheck
				onFinish={handleFinish}
				overflowMenuItems={overflowItems}
			/>

			{showSaved ? <EntrySaved onComplete={handleSavedComplete} /> : null}
		</View>
	);
}

export default function HomeScreen(): React.JSX.Element {
	if (!isOnboardingDone()) {
		return <Redirect href="/onboarding" />;
	}

	return <HomeContent />;
}
