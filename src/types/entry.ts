import type { Attachment } from './attachment';
import type { Timestamp } from './common';
import type { EmotionRecord } from './emotion';
import type { Weather } from './weather';

export interface Entry {
	readonly id: string;
	readonly journalId: string;
	readonly contentHtml: string;
	readonly contentText: string;
	readonly createdAt: Timestamp;
	readonly updatedAt: Timestamp;
}

/** Slim projection for list views — omits contentHtml to reduce memory. */
export type EntrySummary = Omit<Entry, 'contentHtml'>;

export interface EntrySummaryWithJournal extends EntrySummary {
	readonly journalName: string;
}

export interface EntryDetail extends Entry {
	readonly emotions: readonly EmotionRecord[];
	readonly attachments: readonly Attachment[];
	readonly weather: Weather | null;
}
