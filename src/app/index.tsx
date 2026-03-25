import { router, useLocalSearchParams } from 'expo-router';
import { BookOpen, History, Moon, Settings, Sun } from 'lucide-react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { Uniwind, useUniwind } from 'uniwind';

import {
	type EntryComposerHandle,
	EntryComposer,
	type OverflowMenuItem,
} from '@/components/entry-composer';
import { EntrySaved } from '@/components/entry-saved';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function HomeScreen(): React.JSX.Element {
	const { journalId } = useLocalSearchParams<{ journalId?: string }>();
	const { muted } = useThemeColors();
	const { theme } = useUniwind();
	const isDark = theme === 'dark';
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
				id: 'appearance',
				label: isDark ? 'Light' : 'Dark',
				icon: isDark ? <Sun size={16} color={muted} /> : <Moon size={16} color={muted} />,
				onPress: () => Uniwind.setTheme(isDark ? 'light' : 'dark'),
			},
			{
				id: 'settings',
				label: 'Settings',
				icon: <Settings size={16} color={muted} />,
				onPress: () => router.push('/settings'),
			},
		],
		[isDark, muted],
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
