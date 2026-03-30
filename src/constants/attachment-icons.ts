import { AudioLines, FileText, Image, MapPin } from 'lucide-react-native';
import type { ComponentType } from 'react';

import type { AttachmentType } from '@/types/attachment';

export const ATTACHMENT_TYPE_ICONS: Record<
	AttachmentType,
	ComponentType<{ size?: number; color?: string }>
> = {
	image: Image,
	audio: AudioLines,
	document: FileText,
	location: MapPin,
};
