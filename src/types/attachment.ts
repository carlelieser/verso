import type { AttachmentType, Timestamp } from './common';

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

export interface Location {
  readonly id: string;
  readonly entryId: string;
  readonly name: string;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly createdAt: Timestamp;
}
