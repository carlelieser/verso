import type { Timestamp } from './common';

export type AttachmentType = 'image' | 'audio' | 'document';

const ATTACHMENT_TYPES: ReadonlySet<string> = new Set<AttachmentType>([
	'image',
	'audio',
	'document',
]);

export function isAttachmentType(value: string): value is AttachmentType {
	return ATTACHMENT_TYPES.has(value);
}

export interface Attachment {
	readonly id: string;
	readonly entryId: string;
	readonly type: AttachmentType;
	readonly uri: string;
	readonly mimeType: string | null;
	readonly fileName: string | null;
	readonly sizeBytes: number | null;
	readonly displayOrder: number;
	readonly createdAt: Timestamp;
}
