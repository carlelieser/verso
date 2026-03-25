import { Button, Menu } from 'heroui-native';
import {
	AudioLines,
	EllipsisVertical,
	FileText,
	Image,
	Share2,
	Trash2,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import * as Sharing from 'expo-sharing';

import { Overline } from '@/components/overline';
import { useDatabaseContext } from '@/providers/database-provider';
import { deleteAttachment } from '@/services/attachment-service';
import type { Attachment, AttachmentType } from '@/types/attachment';
import { formatFileSize } from '@/utils/format-file-size';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface AttachmentListProps {
	readonly attachments: readonly Attachment[];
	readonly onDelete?: () => void;
}

const TYPE_ICONS: Record<AttachmentType, typeof Image> = {
	image: Image,
	audio: AudioLines,
	document: FileText,
};

export function AttachmentList({
	attachments,
	onDelete,
}: AttachmentListProps): React.JSX.Element | null {
	const { db } = useDatabaseContext();
	const { muted } = useThemeColors();
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const handleShare = useCallback(async (uri: string) => {
		try {
			await Sharing.shareAsync(uri);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Failed to share file';
			Alert.alert('Share Error', message);
		}
	}, []);

	const handleDelete = useCallback(
		(attachment: Attachment) => {
			Alert.alert('Delete Attachment', `Remove "${attachment.fileName ?? 'this file'}"?`, [
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						setDeletingId(attachment.id);
						try {
							await deleteAttachment(db, attachment.id);
							onDelete?.();
						} catch (err: unknown) {
							const message =
								err instanceof Error ? err.message : 'Failed to delete attachment';
							Alert.alert('Delete Error', message);
						} finally {
							setDeletingId(null);
						}
					},
				},
			]);
		},
		[db, onDelete],
	);

	if (attachments.length === 0) return null;

	return (
		<View className="mb-4">
			<View className="mb-3">
				<Overline>ATTACHMENTS</Overline>
			</View>
			<View className="gap-3">
				{attachments.map((attachment) => {
					const Icon = TYPE_ICONS[attachment.type];
					const isDeleting = deletingId === attachment.id;

					return (
						<View
							key={attachment.id}
							className="flex-row items-center gap-3 p-3 rounded-xl bg-surface border border-border"
							style={isDeleting ? { opacity: 0.5 } : undefined}
						>
							<Icon size={20} color={muted} />
							<View className="flex-1">
								<Text className="text-sm text-foreground" numberOfLines={1}>
									{attachment.fileName ?? 'Untitled'}
								</Text>
								<Text className="text-xs text-muted">
									{formatFileSize(attachment.sizeBytes)}
								</Text>
							</View>
							<Menu presentation="popover">
								<Menu.Trigger asChild>
									<Button variant="ghost" size="sm" isIconOnly>
										<EllipsisVertical size={16} color={muted} />
									</Button>
								</Menu.Trigger>
								<Menu.Portal>
									<Menu.Overlay />
									<Menu.Content presentation="popover" width={180}>
										<Menu.Item
											id="share"
											shouldCloseOnSelect
											onPress={() => handleShare(attachment.uri)}
										>
											<Share2 size={16} color={muted} />
											<Menu.ItemTitle>Share</Menu.ItemTitle>
										</Menu.Item>
										<Menu.Item
											id="delete"
											shouldCloseOnSelect
											onPress={() => handleDelete(attachment)}
										>
											<Trash2 size={16} color={muted} />
											<Menu.ItemTitle>Delete</Menu.ItemTitle>
										</Menu.Item>
									</Menu.Content>
								</Menu.Portal>
							</Menu>
						</View>
					);
				})}
			</View>
		</View>
	);
}
