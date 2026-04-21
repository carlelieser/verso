import { router, useLocalSearchParams } from 'expo-router';
import { Button, Toast, useToast } from 'heroui-native';
import { ArrowUpRight, BookOpen, Pencil } from 'lucide-react-native';
import React, { useCallback, useRef } from 'react';
import { View } from 'react-native';

import {
	type EntryComposerHandle,
	EntryComposer,
	type EntrySummary,
} from '@/components/entry/entry-composer';
import { EntrySummaryCard } from '@/components/entry/entry-summary-card';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function NewEntryScreen(): React.JSX.Element {
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

	return (
		<View className="flex-1 bg-background">
			<EntryComposer
				ref={composerRef}
				initialJournalId={journalId}
				isAnimatedCheck
				onFinish={handleFinish}
			/>
		</View>
	);
}
