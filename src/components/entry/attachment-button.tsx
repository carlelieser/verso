import { Button } from 'heroui-native';
import type { MenuContentPopoverProps } from 'heroui-native';
import { AudioLines, FileText, Image, MapPin, Music, Plus } from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';


import { Fab } from '@/components/ui/fab';
import { PopoverMenu, type PopoverMenuItem } from '@/components/ui/popover-menu';
import { VoiceNoteSheet } from '@/components/voice-note/voice-note-sheet';
import { useAttachmentPicker } from '@/hooks/use-attachment-picker';
import { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useDatabaseContext } from '@/providers/database-provider';
import { useConfirmDialog } from '@/providers/dialog-provider';
import { useEntryContext } from '@/providers/entry-provider';
import { addFileAttachment } from '@/services/attachment-service';
import { captureLocationAndWeather } from '@/services/location-weather-service';
import { getErrorMessage } from '@/utils/error';

interface AttachmentButtonProps {
	readonly placement?: MenuContentPopoverProps['placement'];
	readonly offset?: MenuContentPopoverProps['offset'];
	readonly alignOffset?: MenuContentPopoverProps['alignOffset'];
	readonly variant?: 'ghost' | 'fab';
	readonly className?: string;
	readonly style?: StyleProp<ViewStyle>;
}

export function AttachmentButton({
	placement,
	offset,
	alignOffset,
	variant = 'ghost',
	className,
	style,
}: AttachmentButtonProps): React.JSX.Element {
	const { entryId } = useEntryContext();
	const { db } = useDatabaseContext();
	const { accent, accentForeground, muted } = useThemeColors();
	const dialog = useConfirmDialog();

	const { attachments, pickImages, pickAudio, pickDocuments, refresh } = useAttachmentPicker(
		entryId,
		{
			onError: dialog.showError,
		},
	);

	const voiceNoteSheet = useBottomSheet();

	const handleVoiceNoteAttach = useCallback(
		async (uri: string, name: string | null) => {
			try {
				await addFileAttachment(db, {
					entryId,
					type: 'voice-note',
					sourceUri: uri,
					mimeType: 'audio/m4a',
					fileName: name,
					sizeBytes: null,
				});
				await refresh();
			} catch (err: unknown) {
				const message = getErrorMessage(err, 'Failed to attach voice note');
				dialog.showError('Attachment Error', message);
			}
		},
		[db, entryId, refresh, dialog],
	);

	const handleLocation = useCallback(async () => {
		try {
			await captureLocationAndWeather(db, entryId);
		} catch (err: unknown) {
			const message = getErrorMessage(err, 'Failed to capture location');
			dialog.showError('Location Error', message);
		}
	}, [db, entryId, dialog]);

	const items: readonly PopoverMenuItem[] = useMemo(
		() => [
			{ id: 'location', label: 'Location', icon: MapPin, onPress: handleLocation },
			{ id: 'images', label: 'Images', icon: Image, onPress: pickImages },
			{ id: 'audio', label: 'Audio', icon: Music, onPress: pickAudio },
			{ id: 'documents', label: 'Documents', icon: FileText, onPress: pickDocuments },
			{
				id: 'voice-note',
				label: 'Voice note',
				icon: AudioLines,
				onPress: voiceNoteSheet.open,
			},
		],
		[handleLocation, pickImages, pickAudio, pickDocuments, voiceNoteSheet.open],
	);

	const isFab = variant === 'fab';

	const trigger = isFab ? (
		<Fab
			icon={<Plus size={24} color={accentForeground} />}
			className={className}
			style={style}
		/>
	) : (
		<Button variant="ghost" isIconOnly>
			<Plus size={18} color={attachments.length > 0 ? accent : muted} />
		</Button>
	);

	return (
		<>
			<PopoverMenu
				trigger={trigger}
				items={items}
				width={180}
				placement={placement}
				offset={offset}
				alignOffset={alignOffset}
			/>
			{voiceNoteSheet.isOpen ? (
				<VoiceNoteSheet sheet={voiceNoteSheet} onAttach={handleVoiceNoteAttach} />
			) : null}
		</>
	);
}
