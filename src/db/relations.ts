import { relations } from 'drizzle-orm';

import {
  attachments,
  emotionRecords,
  entries,
  journals,
  locations,
  reminders,
  userSettings,
  users,
} from './schema';

export const usersRelations = relations(users, ({ many, one }) => ({
  journals: many(journals),
  reminder: one(reminders),
  settings: one(userSettings),
}));

export const journalsRelations = relations(journals, ({ one, many }) => ({
  user: one(users, { fields: [journals.userId], references: [users.id] }),
  entries: many(entries),
}));

export const entriesRelations = relations(entries, ({ one, many }) => ({
  journal: one(journals, { fields: [entries.journalId], references: [journals.id] }),
  emotionRecords: many(emotionRecords),
  attachments: many(attachments),
  location: one(locations),
}));

export const emotionRecordsRelations = relations(emotionRecords, ({ one }) => ({
  entry: one(entries, { fields: [emotionRecords.entryId], references: [entries.id] }),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  entry: one(entries, { fields: [attachments.entryId], references: [entries.id] }),
}));

export const locationsRelations = relations(locations, ({ one }) => ({
  entry: one(entries, { fields: [locations.entryId], references: [entries.id] }),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  user: one(users, { fields: [reminders.userId], references: [users.id] }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, { fields: [userSettings.userId], references: [users.id] }),
}));
