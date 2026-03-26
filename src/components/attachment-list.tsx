import {Button, Menu} from 'heroui-native';
import {
	AudioLines,
	EllipsisVertical,
	FileText,
	Image,
	MapPin,
	Paperclip,
	Share2,
	Trash2,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import * as Sharing from 'expo-sharing';

import { AppDialog } from '@/components/app-dialog';
import { EmptyState } from '@/components/empty-state';
import { Overline } from '@/components/overline';
import { useDialog } from '@/hooks/use-dialog';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useDatabaseContext } from '@/providers/database-provider';
import { deleteAttachment } from '@/services/attachment-service';
import type { Attachment, FileAttachment, LocationAttachment } from '@/types/attachment';
import { formatFileSize } from '@/utils/format-file-size';

interface AttachmentListProps {
	readonly attachments: readonly Attachment[];
}

const FILE_TYPE_ICONS = {
	image: Image,
	audio: AudioLines,
	document: FileText,
} as const;

function FileCard({attachment, muted, danger, onShare, onDelete, isDeleting}: {
	readonly attachment: FileAttachment;
	readonly muted: string;
	readonly danger: string;
	readonly onShare: () => void;
	readonly onDelete: () => void;
	readonly isDeleting: boolean;
}): React.JSX.Element {
	const Icon = FILE_TYPE_ICONS[attachment.type];

	return (
		<View
			className="flex-row items-center gap-3 p-3 rounded-xl bg-surface border border-border"
			style={isDeleting ? {opacity: 0.5} : undefined}
		>
			<Icon size={20} color={muted}/>
			<View className="flex-1">
				<Text className="text-sm text-foreground" numberOfLines={1}>
					{attachment.data.fileName ?? 'Untitled'}
				</Text>
				<Text className="text-xs text-muted">
					{formatFileSize(attachment.data.sizeBytes)}
				</Text>
			</View>
			<Menu presentation="popover">
				<Menu.Trigger asChild>
					<Button variant="ghost" size="sm" isIconOnly>
						<EllipsisVertical size={16} color={muted}/>
					</Button>
				</Menu.Trigger>
				<Menu.Portal>
					<Menu.Overlay/>
					<Menu.Content presentation="popover" width={180}>
						<Menu.Item id="share" shouldCloseOnSelect onPress={onShare}>
							<Share2 size={16} color={muted}/>
							<Menu.ItemTitle>Share</Menu.ItemTitle>
						</Menu.Item>
						<Menu.Item variant="danger" id="delete" shouldCloseOnSelect onPress={onDelete}>
							<Trash2 size={16} color={danger}/>
							<Menu.ItemTitle>Delete</Menu.ItemTitle>
						</Menu.Item>
					</Menu.Content>
				</Menu.Portal>
			</Menu>
		</View>
	);
}

function LocationCard({attachment, muted, danger, onDelete, isDeleting}: {
	readonly attachment: LocationAttachment;
	readonly muted: string;
	readonly danger: string;
	readonly onDelete: () => void;
	readonly isDeleting: boolean;
}): React.JSX.Element {
	return (
		<View
			className="flex-row items-center gap-3 p-3 rounded-xl bg-surface border border-border"
			style={isDeleting ? {opacity: 0.5} : undefined}
		>
			<MapPin size={20} color={muted}/>
			<View className="flex-1">
				<Text className="text-sm text-foreground" numberOfLines={1}>
					{attachment.data.name}
				</Text>
				{attachment.data.latitude !== null && attachment.data.longitude !== null ? (
					<Text className="text-xs text-muted">
						{attachment.data.latitude.toFixed(4)}, {attachment.data.longitude.toFixed(4)}
					</Text>
				) : null}
			</View>
			<Menu presentation="popover">
				<Menu.Trigger asChild>
					<Button variant="ghost" size="sm" isIconOnly>
						<EllipsisVertical size={16} color={muted}/>
					</Button>
				</Menu.Trigger>
				<Menu.Portal>
					<Menu.Overlay/>
					<Menu.Content presentation="popover" width={180}>
						<Menu.Item variant="danger" id="delete" shouldCloseOnSelect onPress={onDelete}>
							<Trash2 size={16} color={danger}/>
							<Menu.ItemTitle>Delete</Menu.ItemTitle>
						</Menu.Item>
					</Menu.Content>
				</Menu.Portal>
			</Menu>
		</View>
	);
}

export function AttachmentList({
	attachments,
}: AttachmentListProps): React.JSX.Element {
	const { db } = useDatabaseContext();
	const { muted, danger } = useThemeColors();
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const dialog = useDialog();

	const handleShare = useCallback(async (uri: string) => {
		try {
			await Sharing.shareAsync(uri);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Failed to share file';
			await dialog.alert({ title: 'Share Error', description: message });
		}
	}, [dialog]);

	const handleDelete = useCallback(
		async (attachment: Attachment) => {
			const label = attachment.type === 'location'
				? attachment.data.name
				: attachment.data.fileName ?? 'this file';

			const confirmed = await dialog.confirm({
				title: 'Delete Attachment',
				description: `Remove "${label}"? This cannot be undone.`,
				confirmLabel: 'Delete',
				variant: 'danger',
			});

			if (!confirmed) return;

			setDeletingId(attachment.id);
			try {
				await deleteAttachment(db, attachment.id);
			} catch (err: unknown) {
				const message =
					err instanceof Error ? err.message : 'Failed to delete attachment';
				await dialog.alert({ title: 'Delete Error', description: message });
			} finally {
				setDeletingId(null);
			}
		},
		[db, dialog],
	);

	return (
		<View>
			{attachments.length === 0 ? (
				<EmptyState
					icon={<Paperclip size={48} color={muted}/>}
					title="No attachments"
					description="Tap + to add files, images, or audio."
				/>
			) : (
				<View className="gap-3">
					{attachments.map((attachment) => {
						const isDeleting = deletingId === attachment.id;

						if (attachment.type === 'location') {
							return (
								<LocationCard
									key={attachment.id}
									attachment={attachment}
									muted={muted}
									danger={danger}
									onDelete={() => handleDelete(attachment)}
									isDeleting={isDeleting}
								/>
							);
						}

						return (
							<FileCard
								key={attachment.id}
								attachment={attachment}
								muted={muted}
								danger={danger}
								onShare={() => handleShare(attachment.data.uri)}
								onDelete={() => handleDelete(attachment)}
								isDeleting={isDeleting}
							/>
						);
					})}
				</View>
			)}

			<AppDialog
				{...dialog.state}
				onConfirm={dialog.handleConfirm}
				onCancel={dialog.handleCancel}
			/>
		</View>
	);
}
