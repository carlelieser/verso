import { router, useLocalSearchParams } from 'expo-router';
import { History } from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';

import { Button } from 'heroui-native';

import { type EntryComposerHandle, EntryComposer } from '@/components/entry-composer';
import { EntrySaved } from '@/components/entry-saved';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function HomeScreen(): React.JSX.Element {
	const { journalId } = useLocalSearchParams<{ journalId?: string }>();
	const { muted } = useThemeColors();
	const [showSaved, setShowSaved] = useState(false);
	const composerRef = useRef<EntryComposerHandle>(null);

	const handleFinish = useCallback(() => {
		setShowSaved(true);
	}, []);

	const handleSavedComplete = useCallback(() => {
		composerRef.current?.clear();
		setShowSaved(false);
	}, []);

	return (
		<View className="flex-1 bg-background">
			<EntryComposer
				ref={composerRef}
				initialJournalId={journalId}
				isAnimatedCheck
				onFinish={handleFinish}
				onViewAllJournals={() => router.push('/journals')}
				headerRight={
					<Button variant="ghost" size="sm" isIconOnly onPress={() => router.push('/history')}>
						<History size={16} color={muted} />
					</Button>
				}
			/>

			{showSaved ? <EntrySaved onComplete={handleSavedComplete} /> : null}
		</View>
	);
}
