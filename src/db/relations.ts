import { relations } from 'drizzle-orm';

import { attachments, emotionRecords, entries, journals, weatherRecords } from './schema';

export const journalsRelations = relations(journals, ({ many }) => ({
	entries: many(entries),
}));

export const entriesRelations = relations(entries, ({ one, many }) => ({
	journal: one(journals, { fields: [entries.journalId], references: [journals.id] }),
	emotionRecords: many(emotionRecords),
	attachments: many(attachments),
	weather: one(weatherRecords),
}));

export const emotionRecordsRelations = relations(emotionRecords, ({ one }) => ({
	entry: one(entries, { fields: [emotionRecords.entryId], references: [entries.id] }),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
	entry: one(entries, { fields: [attachments.entryId], references: [entries.id] }),
}));

export const weatherRecordsRelations = relations(weatherRecords, ({ one }) => ({
	entry: one(entries, { fields: [weatherRecords.entryId], references: [entries.id] }),
}));
