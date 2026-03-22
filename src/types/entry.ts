import type { EmotionRecord } from './emotion';
import type { Timestamp } from './common';

export interface Entry {
  readonly id: string;
  readonly journalId: string;
  readonly contentHtml: string;
  readonly contentText: string;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export interface EntryWithJournal extends Entry {
  readonly journalName: string;
}

export interface EntryWithEmotions extends Entry {
  readonly emotions: readonly EmotionRecord[];
}
