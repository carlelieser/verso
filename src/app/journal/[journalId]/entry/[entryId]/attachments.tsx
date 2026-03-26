import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AttachmentButton } from '@/components/attachment-button';
import { AttachmentList } from '@/components/attachment-list';
import { ScreenLayout } from '@/components/screen-layout';
import { useLiveAttachments } from '@/hooks/use-live-attachments';
import { EntryProvider } from '@/providers/entry-provider';

function AttachmentsContent(): React.JSX.Element {
	const { entryId } = useLocalSearchParams<{ journalId: string; entryId: string }>();
	const insets = useSafeAreaInsets();
	const attachments = useLiveAttachments(entryId);

	return (
		<ScreenLayout title="Attachments">
			<ScrollView
				className="rounded-t-4xl overflow-hidden"
				contentContainerClassName="px-4"
				contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
			>
				<AttachmentList attachments={attachments} />
			</ScrollView>

			<AttachmentButton
				variant="fab"
				placement="top"
				className="absolute right-4"
				style={{ bottom: insets.bottom + 16 }}
				offset={12}
			/>
		</ScreenLayout>
	);
}

export default function AttachmentsScreen(): React.JSX.Element {
	const { entryId } = useLocalSearchParams<{ journalId: string; entryId: string }>();

	return (
		<EntryProvider entryId={entryId}>
			<AttachmentsContent />
		</EntryProvider>
	);
}
