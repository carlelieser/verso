import { Button } from 'heroui-native';
import type { MenuContentPopoverProps } from 'heroui-native';
import { AudioLines, FileText, Image, MapPin, Paperclip } from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { Fab } from '@/components/ui/fab';
import { PopoverMenu, type PopoverMenuItem } from '@/components/ui/popover-menu';
import { useAttachmentPicker } from '@/hooks/use-attachment-picker';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useDatabaseContext } from '@/providers/database-provider';
import { useAppDialog } from '@/providers/dialog-provider';
import { useEntryContext } from '@/providers/entry-provider';
import { captureLocationAndWeather } from '@/services/location-weather-service';

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
	const dialog = useAppDialog();

	const { attachments, pickImages, pickAudio, pickDocuments } = useAttachmentPicker(entryId, {
		onError: dialog.showError,
	});

	const handleLocation = useCallback(async () => {
		try {
			await captureLocationAndWeather(db, entryId);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Failed to capture location';
			dialog.showError('Location Error', message);
		}
	}, [db, entryId, dialog]);

	const items: readonly PopoverMenuItem[] = useMemo(
		() => [
			{ id: 'location', label: 'Location', icon: MapPin, onPress: handleLocation },
			{ id: 'images', label: 'Images', icon: Image, onPress: pickImages },
			{ id: 'audio', label: 'Audio', icon: AudioLines, onPress: pickAudio },
			{ id: 'documents', label: 'Documents', icon: FileText, onPress: pickDocuments },
		],
		[handleLocation, pickImages, pickAudio, pickDocuments],
	);

	const isFab = variant === 'fab';

	const trigger = isFab ? (
		<Fab
			icon={<Paperclip size={24} color={accentForeground} />}
			className={className}
			style={style}
		/>
	) : (
		<Button variant="ghost" isIconOnly>
			<Paperclip size={18} color={attachments.length > 0 ? accent : muted} />
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

		</>
	);
}
