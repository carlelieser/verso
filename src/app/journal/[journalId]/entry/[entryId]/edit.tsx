import { router, useLocalSearchParams } from 'expo-router';
import { Button } from 'heroui-native';
import { ChevronLeft } from 'lucide-react-native';
import React, { useCallback } from 'react';

import { EntryComposer } from '@/components/entry/entry-composer';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function EntryEditScreen(): React.JSX.Element {
	const { entryId } = useLocalSearchParams<{ journalId: string; entryId: string }>();
	const { muted } = useThemeColors();

	const handleFinish = useCallback(() => router.back(), []);

	return (
		<EntryComposer
			entryId={entryId}
			onFinish={handleFinish}
			headerLeft={
				<Button variant="ghost" size="sm" isIconOnly onPress={() => router.back()}>
					<ChevronLeft size={20} color={muted} />
				</Button>
			}
		/>
	);
}
