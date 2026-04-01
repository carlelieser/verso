import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AttachmentButton } from '@/components/entry/attachment-button';
import { AttachmentList } from '@/components/entry/attachment-list';
import { Screen } from '@/components/layout/screen';
import { useLiveAttachments } from '@/hooks/use-live-attachments';
import { EntryProvider } from '@/providers/entry-provider';

function AttachmentsContent(): React.JSX.Element {
	const { entryId } = useLocalSearchParams<{ journalId: string; entryId: string }>();
	const insets = useSafeAreaInsets();
	const attachments = useLiveAttachments(entryId);

	return (
		<Screen title="Attachments">
			<ScrollView
				className="rounded-t-4xl overflow-hidden"
				contentContainerClassName="px-4"
				contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 80 }}
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
		</Screen>
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
