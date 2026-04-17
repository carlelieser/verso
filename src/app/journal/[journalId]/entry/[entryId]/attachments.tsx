import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView } from 'react-native';

import { AttachmentButton } from '@/components/entry/attachment-button';
import { AttachmentList } from '@/components/entry/attachment-list';
import { Screen } from '@/components/layout/screen';
import { useScreenInsets } from '@/contexts/screen-context';
import { useLiveAttachments } from '@/hooks/use-live-attachments';
import { EntryProvider } from '@/providers/entry-provider';

function AttachmentsList({ entryId }: { readonly entryId: string }): React.JSX.Element {
	const { contentInsetBottom } = useScreenInsets();
	const attachments = useLiveAttachments(entryId);

	return (
		<ScrollView
			className="rounded-t-4xl overflow-hidden"
			contentContainerClassName="px-4"
			contentContainerStyle={{ flexGrow: 1, paddingBottom: contentInsetBottom }}
		>
			<AttachmentList attachments={attachments} />
		</ScrollView>
	);
}

function AttachmentsContent(): React.JSX.Element {
	const { entryId } = useLocalSearchParams<{ journalId: string; entryId: string }>();

	return (
		<Screen
			title="Attachments"
			fab={<AttachmentButton variant="fab" placement="top" offset={12} />}
		>
			<AttachmentsList entryId={entryId ?? ''} />
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
