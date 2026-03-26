import { Button, Menu } from 'heroui-native';
import type { MenuContentPopoverProps } from 'heroui-native';
import { AudioLines, FileText, Image, Paperclip } from 'lucide-react-native';
import React from 'react';

import { useAttachmentPicker } from '@/hooks/use-attachment-picker';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useEntryContext } from '@/providers/entry-provider';

interface AttachmentButtonProps {
	readonly placement?: MenuContentPopoverProps['placement'];
}

export function AttachmentButton({ placement }: AttachmentButtonProps): React.JSX.Element {
	const { entryId } = useEntryContext();
	const { accent, muted } = useThemeColors();
	const { attachments, pickImages, pickAudio, pickDocuments } = useAttachmentPicker(entryId);

	return (
		<Menu presentation="popover">
			<Menu.Trigger asChild>
				<Button variant="ghost" isIconOnly>
					<Paperclip size={18} color={attachments.length > 0 ? accent : muted} />
				</Button>
			</Menu.Trigger>
			<Menu.Portal>
				<Menu.Overlay />
				<Menu.Content presentation="popover" width={180} placement={placement}>
					<Menu.Item id="images" shouldCloseOnSelect onPress={pickImages}>
						<Image size={16} color={muted} />
						<Menu.ItemTitle>Images</Menu.ItemTitle>
					</Menu.Item>
					<Menu.Item id="audio" shouldCloseOnSelect onPress={pickAudio}>
						<AudioLines size={16} color={muted} />
						<Menu.ItemTitle>Audio</Menu.ItemTitle>
					</Menu.Item>
					<Menu.Item id="documents" shouldCloseOnSelect onPress={pickDocuments}>
						<FileText size={16} color={muted} />
						<Menu.ItemTitle>Documents</Menu.ItemTitle>
					</Menu.Item>
				</Menu.Content>
			</Menu.Portal>
		</Menu>
	);
}
