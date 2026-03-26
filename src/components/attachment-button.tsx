import {Button, Menu} from 'heroui-native';
import type {MenuContentPopoverProps} from 'heroui-native';
import {AudioLines, FileText, Image, MapPin, Paperclip} from 'lucide-react-native';
import React, {useCallback} from 'react';
import {Alert} from 'react-native';
import type {StyleProp, ViewStyle} from 'react-native';

import {Fab} from '@/components/fab';
import {useAttachmentPicker} from '@/hooks/use-attachment-picker';
import {useThemeColors} from '@/hooks/use-theme-colors';
import {useDatabaseContext} from '@/providers/database-provider';
import {useEntryContext} from '@/providers/entry-provider';
import {captureLocationAndWeather} from '@/services/location-weather-service';

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
	const {entryId} = useEntryContext();
	const {db} = useDatabaseContext();
	const {accent, accentForeground, muted} = useThemeColors();
	const {attachments, pickImages, pickAudio, pickDocuments} = useAttachmentPicker(entryId);

	const handleLocation = useCallback(async () => {
		try {
			await captureLocationAndWeather(db, entryId);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Failed to capture location';
			Alert.alert('Location Error', message);
		}
	}, [db, entryId]);

	const isFab = variant === 'fab';

	return (
		<Menu presentation="popover">
			<Menu.Trigger asChild>
				{isFab ? (
					<Fab
						icon={<Paperclip size={24} color={accentForeground} />}
						className={className}
						style={style}
					/>
				) : (
					<Button variant="ghost" isIconOnly>
						<Paperclip size={18} color={attachments.length > 0 ? accent : muted} />
					</Button>
				)}
			</Menu.Trigger>
			<Menu.Portal>
				<Menu.Overlay />
				<Menu.Content
					presentation="popover"
					width={180}
					placement={placement}
					offset={offset}
					alignOffset={alignOffset}
				>
					<Menu.Item id="location" shouldCloseOnSelect onPress={handleLocation}>
						<MapPin size={16} color={muted} />
						<Menu.ItemTitle>Location</Menu.ItemTitle>
					</Menu.Item>
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
