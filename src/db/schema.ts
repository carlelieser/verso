import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('user', {
  id: text('id').primaryKey(),
  supabaseId: text('supabase_id').unique(),
  email: text('email'),
  displayName: text('display_name'),
  isGuest: integer('is_guest', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const journals = sqliteTable(
  'journal',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    icon: text('icon').notNull().default('book-open'),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    index('journal_user_idx').on(table.userId),
    index('journal_user_order_idx').on(table.userId, table.displayOrder),
    uniqueIndex('journal_user_name_idx').on(table.userId, table.name),
  ],
);

/**
 * Journal entries table.
 *
 * NOTE: The `contentText` column is mirrored by FTS5 triggers defined in `fts.ts`.
 * If this column is renamed or removed, the FTS triggers must be updated in lockstep.
 */
export const entries = sqliteTable(
  'entry',
  {
    id: text('id').primaryKey(),
    journalId: text('journal_id')
      .notNull()
      .references(() => journals.id, { onDelete: 'cascade' }),
    contentHtml: text('content_html').notNull().default(''),
    contentText: text('content_text').notNull().default(''),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    index('entry_journal_idx').on(table.journalId),
    index('entry_journal_created_idx').on(table.journalId, table.createdAt),
    index('entry_created_idx').on(table.createdAt),
  ],
);

export const emotionRecords = sqliteTable(
  'emotion_record',
  {
    id: text('id').primaryKey(),
    entryId: text('entry_id')
      .notNull()
      .references(() => entries.id, { onDelete: 'cascade' }),
    category: text('category').notNull(),
    intensity: integer('intensity').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    index('emotion_entry_idx').on(table.entryId),
    index('emotion_category_idx').on(table.category),
    index('emotion_entry_intensity_idx').on(table.entryId, table.intensity),
  ],
);

export const attachments = sqliteTable(
  'attachment',
  {
    id: text('id').primaryKey(),
    entryId: text('entry_id')
      .notNull()
      .references(() => entries.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    uri: text('uri').notNull(),
    mimeType: text('mime_type'),
    fileName: text('file_name'),
    sizeBytes: integer('size_bytes'),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('attachment_entry_idx').on(table.entryId)],
);

export const locations = sqliteTable(
  'location',
  {
    id: text('id').primaryKey(),
    entryId: text('entry_id')
      .notNull()
      .references(() => entries.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    latitude: real('latitude'),
    longitude: real('longitude'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [uniqueIndex('location_entry_idx').on(table.entryId)],
);

export const reminders = sqliteTable(
  'reminder',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(false),
    hour: integer('hour').notNull(),
    minute: integer('minute').notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [uniqueIndex('reminder_user_idx').on(table.userId)],
);

export const userSettings = sqliteTable(
  'user_settings',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    hasCompletedOnboarding: integer('has_completed_onboarding', { mode: 'boolean' })
      .notNull()
      .default(false),
    lastActiveJournalId: text('last_active_journal_id').references(() => journals.id),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [uniqueIndex('settings_user_idx').on(table.userId)],
);
