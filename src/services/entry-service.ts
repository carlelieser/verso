import { and, desc, eq, ne } from 'drizzle-orm';

import type { Db } from '@/db/client';
import { getRawClient } from '@/db/client';
import { emotionRecords, entries, journals } from '@/db/schema';
import { EntryNotFoundError } from '@/errors/domain-errors';
import { deleteAttachmentFiles, listAttachments } from '@/services/attachment-service';
import { getWeather } from '@/services/weather-service';
import { isEmotionCategory, isEmotionIntensity } from '@/types/common';
import type { EmotionRecord } from '@/types/emotion';
import type { Entry, EntryDetail, EntryWithJournal } from '@/types/entry';
import { generateId } from '@/utils/id';

interface CreateEntryInput {
	readonly journalId: string;
	readonly contentHtml: string;
	readonly contentText: string;
}

interface UpdateEntryInput {
	readonly id: string;
	readonly journalId?: string;
	readonly contentHtml: string;
	readonly contentText: string;
}

interface ListEntriesInput {
	readonly journalId?: string;
	readonly limit?: number;
	readonly offset?: number;
}

function toEntry(row: {
	id: string;
	journalId: string;
	contentHtml: string;
	contentText: string;
	createdAt: Date;
	updatedAt: Date;
}): Entry {
	return {
		id: row.id,
		journalId: row.journalId,
		contentHtml: row.contentHtml,
		contentText: row.contentText,
		createdAt: row.createdAt.getTime(),
		updatedAt: row.updatedAt.getTime(),
	};
}

export async function createEntry(db: Db, input: CreateEntryInput): Promise<Entry> {
	const now = new Date();
	const id = generateId();

	await db.insert(entries).values({
		id,
		journalId: input.journalId,
		contentHtml: input.contentHtml,
		contentText: input.contentText,
		createdAt: now,
		updatedAt: now,
	});

	return {
		id,
		journalId: input.journalId,
		contentHtml: input.contentHtml,
		contentText: input.contentText,
		createdAt: now.getTime(),
		updatedAt: now.getTime(),
	};
}

export async function updateEntry(db: Db, input: UpdateEntryInput): Promise<void> {
	const updates: Record<string, unknown> = {
		contentHtml: input.contentHtml,
		contentText: input.contentText,
		updatedAt: new Date(),
	};

	if (input.journalId !== undefined) {
		updates.journalId = input.journalId;
	}

	await db.update(entries).set(updates).where(eq(entries.id, input.id));
}

export async function deleteEntry(db: Db, id: string): Promise<void> {
	const [existing] = await db
		.select({ id: entries.id })
		.from(entries)
		.where(eq(entries.id, id))
		.limit(1);
	if (!existing) throw new EntryNotFoundError(id);
	deleteAttachmentFiles(id);
	await db.delete(entries).where(eq(entries.id, id));
}

export async function getEntry(db: Db, id: string): Promise<EntryDetail> {
	const [row] = await db.select().from(entries).where(eq(entries.id, id)).limit(1);

	if (!row) throw new EntryNotFoundError(id);

	const [emotions, entryAttachments, weather] = await Promise.all([
		db.select().from(emotionRecords).where(eq(emotionRecords.entryId, id)),
		listAttachments(db, id),
		getWeather(db, id),
	]);

	const validEmotions: EmotionRecord[] = [];
	for (const e of emotions) {
		if (isEmotionCategory(e.category) && isEmotionIntensity(e.intensity)) {
			validEmotions.push({
				id: e.id,
				entryId: e.entryId,
				category: e.category,
				intensity: e.intensity,
				createdAt: e.createdAt.getTime(),
			});
		}
	}

	return {
		...toEntry(row),
		emotions: validEmotions,
		attachments: entryAttachments,
		weather,
	};
}

export async function listEntries(db: Db, input: ListEntriesInput): Promise<EntryWithJournal[]> {
	const limit = input.limit ?? 50;
	const offset = input.offset ?? 0;

	const nonEmpty = ne(entries.contentText, '');
	const filter = input.journalId
		? and(nonEmpty, eq(entries.journalId, input.journalId))
		: nonEmpty;

	const rows = await db
		.select({
			id: entries.id,
			journalId: entries.journalId,
			contentHtml: entries.contentHtml,
			contentText: entries.contentText,
			createdAt: entries.createdAt,
			updatedAt: entries.updatedAt,
			journalName: journals.name,
		})
		.from(entries)
		.innerJoin(journals, eq(entries.journalId, journals.id))
		.where(filter)
		.orderBy(desc(entries.createdAt))
		.limit(limit)
		.offset(offset);

	return rows.map((row) => ({
		id: row.id,
		journalId: row.journalId,
		contentHtml: row.contentHtml,
		contentText: row.contentText,
		createdAt: row.createdAt.getTime(),
		updatedAt: row.updatedAt.getTime(),
		journalName: row.journalName,
	}));
}

interface FtsRow {
	readonly id: string;
	readonly journal_id: string;
	readonly content_html: string;
	readonly content_text: string;
	readonly created_at: number;
	readonly updated_at: number;
	readonly journal_name: string;
}

export async function searchEntries(db: Db, query: string): Promise<EntryWithJournal[]> {
	const rawDb = getRawClient(db);

	const rows = (await rawDb.getAllAsync(
		`SELECT e.id, e.journal_id, e.content_html, e.content_text, e.created_at, e.updated_at, j.name as journal_name
     FROM entry_fts fts
     JOIN entry e ON e.rowid = fts.rowid
     JOIN journal j ON j.id = e.journal_id
     WHERE entry_fts MATCH ?
     ORDER BY rank`,
		[query],
	)) as FtsRow[]; // System boundary: raw SQL result shape is not typed by the driver

	return rows.map((row) => ({
		id: row.id,
		journalId: row.journal_id,
		contentHtml: row.content_html,
		contentText: row.content_text,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
		journalName: row.journal_name,
	}));
}
