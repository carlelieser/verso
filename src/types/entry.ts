import type { Timestamp } from './common';

export interface Entry {
  readonly id: string;
  readonly journalId: string;
  readonly contentHtml: string;
  readonly contentText: string;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}
