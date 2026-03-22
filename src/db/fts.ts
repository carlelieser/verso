import { getRawClient } from './client';
import type { Db } from './client';

export function setupFts(db: Db): void {
  const rawDb = getRawClient(db);

  rawDb.execSync(`
    CREATE VIRTUAL TABLE IF NOT EXISTS entry_fts
    USING fts5(content_text, content=entry, content_rowid=rowid);
  `);

  rawDb.execSync(`
    CREATE TRIGGER IF NOT EXISTS entry_fts_insert AFTER INSERT ON entry BEGIN
      INSERT INTO entry_fts(rowid, content_text) VALUES (NEW.rowid, NEW.content_text);
    END;
  `);

  rawDb.execSync(`
    CREATE TRIGGER IF NOT EXISTS entry_fts_update AFTER UPDATE ON entry BEGIN
      INSERT INTO entry_fts(entry_fts, rowid, content_text) VALUES('delete', OLD.rowid, OLD.content_text);
      INSERT INTO entry_fts(rowid, content_text) VALUES (NEW.rowid, NEW.content_text);
    END;
  `);

  rawDb.execSync(`
    CREATE TRIGGER IF NOT EXISTS entry_fts_delete AFTER DELETE ON entry BEGIN
      INSERT INTO entry_fts(entry_fts, rowid, content_text) VALUES('delete', OLD.rowid, OLD.content_text);
    END;
  `);
}
