import * as Sharing from 'expo-sharing';
import { Button } from 'heroui-native';
import { EllipsisVertical, MapPin, Paperclip, Share2, Trash2 } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { InfoCard } from '@/components/ui/info-card';
import { PopoverMenu, type PopoverMenuItem } from '@/components/ui/popover-menu';
import { ATTACHMENT_TYPE_ICONS } from '@/constants/attachment-icons';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useDatabaseContext } from '@/providers/database-provider';
import { useAppDialog } from '@/providers/dialog-provider';
import { deleteAttachment } from '@/services/attachment-service';
import type { Attachment, FileAttachment, LocationAttachment } from '@/types/attachment';
import { formatFileSize } from '@/utils/format-file-size';

interface AttachmentListProps {
	readonly attachments: readonly Attachment[];
}

function FileCard({
	attachment,
	onShare,
	onDelete,
	isDeleting,
}: {
	readonly attachment: FileAttachment;
	readonly onShare: () => void;
	readonly onDelete: () => void;
	readonly isDeleting: boolean;
}): React.JSX.Element {
	const { muted } = useThemeColors();
	const Icon = ATTACHMENT_TYPE_ICONS[attachment.type];

	const menuItems: readonly PopoverMenuItem[] = useMemo(
		() => [
			{ id: 'share', label: 'Share', icon: Share2, onPress: onShare },
			{ id: 'delete', label: 'Delete', icon: Trash2, variant: 'danger' as const, onPress: onDelete },
		],
		[onShare, onDelete],
	);

	return (
		<InfoCard style={isDeleting ? { opacity: 0.5 } : undefined}>
			<Icon size={20} color={muted} />
			<View className="flex-1">
				<Text className="text-sm text-foreground" numberOfLines={1}>
					{attachment.data.fileName ?? 'Untitled'}
				</Text>
				<Text className="text-xs text-muted">
					{formatFileSize(attachment.data.sizeBytes)}
				</Text>
			</View>
			<PopoverMenu
				trigger={
					<Button variant="ghost" size="sm" isIconOnly>
						<EllipsisVertical size={16} color={muted} />
					</Button>
				}
				items={menuItems}
				width={180}
			/>
		</InfoCard>
	);
}

function LocationCard({
	attachment,
	onDelete,
	isDeleting,
}: {
	readonly attachment: LocationAttachment;
	readonly onDelete: () => void;
	readonly isDeleting: boolean;
}): React.JSX.Element {
	const { muted } = useThemeColors();

	const menuItems: readonly PopoverMenuItem[] = useMemo(
		() => [
			{ id: 'delete', label: 'Delete', icon: Trash2, variant: 'danger' as const, onPress: onDelete },
		],
		[onDelete],
	);

	return (
		<InfoCard style={isDeleting ? { opacity: 0.5 } : undefined}>
			<MapPin size={20} color={muted} />
			<View className="flex-1">
				<Text className="text-sm text-foreground" numberOfLines={1}>
					{attachment.data.name}
				</Text>
				{attachment.data.latitude !== null && attachment.data.longitude !== null ? (
					<Text className="text-xs text-muted">
						{attachment.data.latitude.toFixed(4)},{' '}
						{attachment.data.longitude.toFixed(4)}
					</Text>
				) : null}
			</View>
			<PopoverMenu
				trigger={
					<Button variant="ghost" size="sm" isIconOnly>
						<EllipsisVertical size={16} color={muted} />
					</Button>
				}
				items={menuItems}
				width={180}
			/>
		</InfoCard>
	);
}

export function AttachmentList({ attachments }: AttachmentListProps): React.JSX.Element {
	const { db } = useDatabaseContext();
	const { muted } = useThemeColors();
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const dialog = useAppDialog();

	const handleShare = useCallback(
		async (uri: string) => {
			try {
				await Sharing.shareAsync(uri);
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : 'Failed to share file';
				await dialog.alert({ title: 'Share Error', description: message });
			}
		},
		[dialog],
	);

	const handleDelete = useCallback(
		async (attachment: Attachment) => {
			const label =
				attachment.type === 'location'
					? attachment.data.name
					: (attachment.data.fileName ?? 'this file');

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
				const message = err instanceof Error ? err.message : 'Failed to delete attachment';
				await dialog.alert({ title: 'Delete Error', description: message });
			} finally {
				setDeletingId(null);
			}
		},
		[db, dialog],
	);

	return (
		<View className={'flex-1'}>
			{attachments.length === 0 ? (
				<EmptyState
					icon={<Paperclip size={48} color={muted} />}
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
									onDelete={() => handleDelete(attachment)}
									isDeleting={isDeleting}
								/>
							);
						}

						return (
							<FileCard
								key={attachment.id}
								attachment={attachment}
								onShare={() => handleShare(attachment.data.uri)}
								onDelete={() => handleDelete(attachment)}
								isDeleting={isDeleting}
							/>
						);
					})}
				</View>
			)}

		</View>
	);
}
