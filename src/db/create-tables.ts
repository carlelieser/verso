import type { Db } from './client';
import { getRawClient } from './client';

/**
 * Creates all tables if they don't already exist.
 * Called on every app launch — idempotent via IF NOT EXISTS.
 */
export function createTables(db: Db): void {
	const raw = getRawClient(db);

	raw.execSync(`
    CREATE TABLE IF NOT EXISTS journal (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT 'book-open',
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

	raw.execSync(`
    CREATE UNIQUE INDEX IF NOT EXISTS journal_name_idx ON journal (name);
  `);

	raw.execSync(`
    CREATE INDEX IF NOT EXISTS journal_order_idx ON journal (display_order);
  `);

	raw.execSync(`
    CREATE TABLE IF NOT EXISTS entry (
      id TEXT PRIMARY KEY NOT NULL,
      journal_id TEXT NOT NULL REFERENCES journal(id) ON DELETE CASCADE,
      content_html TEXT NOT NULL DEFAULT '',
      content_text TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

	raw.execSync(`CREATE INDEX IF NOT EXISTS entry_journal_idx ON entry (journal_id);`);
	raw.execSync(
		`CREATE INDEX IF NOT EXISTS entry_journal_created_idx ON entry (journal_id, created_at);`,
	);
	raw.execSync(`CREATE INDEX IF NOT EXISTS entry_created_idx ON entry (created_at);`);

	raw.execSync(`
    CREATE TABLE IF NOT EXISTS emotion_record (
      id TEXT PRIMARY KEY NOT NULL,
      entry_id TEXT NOT NULL REFERENCES entry(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      intensity INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

	raw.execSync(`CREATE INDEX IF NOT EXISTS emotion_entry_idx ON emotion_record (entry_id);`);
	raw.execSync(`CREATE INDEX IF NOT EXISTS emotion_category_idx ON emotion_record (category);`);
	raw.execSync(
		`CREATE INDEX IF NOT EXISTS emotion_entry_intensity_idx ON emotion_record (entry_id, intensity);`,
	);

	raw.execSync(`
    CREATE TABLE IF NOT EXISTS attachment (
      id TEXT PRIMARY KEY NOT NULL,
      entry_id TEXT NOT NULL REFERENCES entry(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      uri TEXT NOT NULL,
      mime_type TEXT,
      file_name TEXT,
      size_bytes INTEGER,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
  `);

	raw.execSync(`CREATE INDEX IF NOT EXISTS attachment_entry_idx ON attachment (entry_id);`);

	raw.execSync(`
    CREATE TABLE IF NOT EXISTS location (
      id TEXT PRIMARY KEY NOT NULL,
      entry_id TEXT NOT NULL REFERENCES entry(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      created_at INTEGER NOT NULL
    );
  `);

	raw.execSync(`CREATE UNIQUE INDEX IF NOT EXISTS location_entry_idx ON location (entry_id);`);

	raw.execSync(`
    CREATE TABLE IF NOT EXISTS weather_record (
      id TEXT PRIMARY KEY NOT NULL,
      entry_id TEXT NOT NULL REFERENCES entry(id) ON DELETE CASCADE,
      temperature REAL NOT NULL,
      condition TEXT NOT NULL,
      humidity INTEGER NOT NULL,
      wind_speed REAL NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

	raw.execSync(
		`CREATE UNIQUE INDEX IF NOT EXISTS weather_entry_idx ON weather_record (entry_id);`,
	);
}
