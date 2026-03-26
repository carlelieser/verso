import { router } from 'expo-router';
import { AudioLines, ChevronRight, FileText, Image, MapPin, Paperclip } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { useThemeColors } from '@/hooks/use-theme-colors';
import type { Attachment } from '@/types/attachment';
import { formatFileSize } from '@/utils/format-file-size';

interface AttachmentPreviewProps {
	readonly journalId: string;
	readonly entryId: string;
	readonly attachments: readonly Attachment[];
}

const FILE_TYPE_ICONS = {
	image: Image,
	audio: AudioLines,
	document: FileText,
	location: MapPin,
} as const;

function AttachmentSummary({ attachment, muted }: {
	readonly attachment: Attachment;
	readonly muted: string;
}): React.JSX.Element {
	const Icon = FILE_TYPE_ICONS[attachment.type];

	if (attachment.type === 'location') {
		return (
			<View className="flex-row items-center gap-3">
				<Icon size={20} color={muted} />
				<Text className="text-sm text-foreground flex-1" numberOfLines={1}>
					{attachment.data.name}
				</Text>
			</View>
		);
	}

	return (
		<View className="flex-row items-center gap-3">
			<Icon size={20} color={muted} />
			<View className="flex-1">
				<Text className="text-sm text-foreground" numberOfLines={1}>
					{attachment.data.fileName ?? 'Untitled'}
				</Text>
				<Text className="text-xs text-muted">
					{formatFileSize(attachment.data.sizeBytes)}
				</Text>
			</View>
		</View>
	);
}

export function AttachmentPreview({
	journalId,
	entryId,
	attachments,
}: AttachmentPreviewProps): React.JSX.Element | null {
	const { muted } = useThemeColors();

	if (attachments.length === 0) return null;

	const previewed = attachments.slice(0, 3);

	return (
		<Pressable
			className="p-3 rounded-xl bg-surface border border-border gap-2"
			onPress={() => router.push(`/journal/${journalId}/entry/${entryId}/attachments`)}
		>
			{previewed.map((attachment) => (
				<AttachmentSummary key={attachment.id} attachment={attachment} muted={muted} />
			))}

			<View className="flex-row items-center justify-between mt-1 pt-3 border-t border-border">
				<View className="flex-row items-center gap-2">
					<Paperclip size={14} color={muted} />
					<Text className="text-xs text-muted">
						View {attachments.length} {attachments.length === 1 ? 'attachment' : 'attachments'}
					</Text>
				</View>
				<ChevronRight size={14} color={muted} />
			</View>
		</Pressable>
	);
}
