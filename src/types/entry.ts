import type { Timestamp } from './common';
import type { EmotionRecord } from './emotion';
import type { Location } from './location';
import type { Weather } from './weather';

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

export interface EntryDetail extends Entry {
	readonly emotions: readonly EmotionRecord[];
	readonly location: Location | null;
	readonly weather: Weather | null;
}
