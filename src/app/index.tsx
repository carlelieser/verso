import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Button, Toast, useToast } from 'heroui-native';
import { ArrowUpRight, BookOpen, History, Pencil, Settings } from 'lucide-react-native';
import React, { useCallback, useMemo, useRef } from 'react';
import { View } from 'react-native';

import {
	type EntryComposerHandle,
	EntryComposer,
	type EntrySummary,
	type OverflowMenuItem,
} from '@/components/entry/entry-composer';
import { EntrySummaryCard } from '@/components/entry/entry-summary-card';
import { SETTINGS_ONBOARDING_COMPLETE_KEY } from '@/constants/settings';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { storage } from '@/services/storage';

function isOnboardingDone(): boolean {
	return storage.get(SETTINGS_ONBOARDING_COMPLETE_KEY, false);
}

function HomeContent(): React.JSX.Element {
	const { journalId } = useLocalSearchParams<{ journalId?: string }>();
	const { muted } = useThemeColors();
	const composerRef = useRef<EntryComposerHandle>(null);
	const { toast } = useToast();

	const handleFinish = useCallback(
		(summary: EntrySummary) => {
			composerRef.current?.clear();
			const hasDetails = summary.emotions.length > 0 || summary.attachments.length > 0;
			toast.show({
				component: (props) => (
					<Toast placement="bottom" {...props}>
						<View className="flex-row items-center gap-2">
							<Toast.Title>Entry saved</Toast.Title>
							<Toast.Close className="ml-auto" />
						</View>
						{hasDetails ? (
							<EntrySummaryCard
								journalId={summary.journalId}
								entryId={summary.entryId}
								emotions={summary.emotions}
								attachments={summary.attachments}
							/>
						) : null}
						<View className="flex-row items-center justify-end gap-2 mt-4">
							<Button
								size="sm"
								variant="secondary"
								onPress={() => router.push(`/journal/${summary.journalId}`)}
							>
								<BookOpen size={14} color={muted} />
								<Button.Label>Journal</Button.Label>
							</Button>
							<Button
								size="sm"
								variant="secondary"
								onPress={() =>
									router.push(
										`/journal/${summary.journalId}/entry/${summary.entryId}/edit`,
									)
								}
							>
								<Pencil size={14} color={muted} />
								<Button.Label>Edit</Button.Label>
							</Button>
							<Button
								size="sm"
								variant="secondary"
								onPress={() =>
									router.push(
										`/journal/${summary.journalId}/entry/${summary.entryId}`,
									)
								}
							>
								<ArrowUpRight size={14} color={muted} />
								<Button.Label>View</Button.Label>
							</Button>
						</View>
					</Toast>
				),
			});
		},
		[toast, muted],
	);

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
		</View>
	);
}

export default function HomeScreen(): React.JSX.Element {
	if (!isOnboardingDone()) {
		return <Redirect href="/onboarding" />;
	}

	return <HomeContent />;
}
