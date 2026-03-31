import type { Timestamp } from './common';

export interface FileData {
	readonly uri: string;
	readonly mimeType: string | null;
	readonly fileName: string | null;
	readonly sizeBytes: number | null;
}

export interface LocationData {
	readonly name: string;
	readonly latitude: number | null;
	readonly longitude: number | null;
}

interface AttachmentBase {
	readonly id: string;
	readonly entryId: string;
	readonly displayOrder: number;
	readonly createdAt: Timestamp;
}

export interface FileAttachment extends AttachmentBase {
	readonly type: 'image' | 'audio' | 'document' | 'voice-note';
	readonly data: FileData;
}

export interface LocationAttachment extends AttachmentBase {
	readonly type: 'location';
	readonly data: LocationData;
}

export type Attachment = FileAttachment | LocationAttachment;

export type AttachmentType = Attachment['type'];

const ATTACHMENT_TYPES: ReadonlySet<string> = new Set<AttachmentType>([
	'image',
	'audio',
	'document',
	'location',
	'voice-note',
]);

export function isAttachmentType(value: string): value is AttachmentType {
	return ATTACHMENT_TYPES.has(value);
}
