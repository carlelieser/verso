import { DEFAULT_JOURNAL_COLOR } from '@/constants/journal-icons';
import type { Db } from '@/db/client';
import { getRawClient } from '@/db/client';
import { generateId } from '@/utils/id';

/**
 * Ensures a default "Daily" journal exists.
 * Uses raw SQL with a conditional insert to stay idempotent.
 */
export function ensureDefaultJournal(db: Db): void {
	const raw = getRawClient(db);
	const now = Date.now();

	const existing = raw.getAllSync(`SELECT id FROM journal WHERE name = ? LIMIT 1`, ['Daily']);

	if (existing.length > 0) return;

	raw.runSync(
		`INSERT INTO journal (id, name, icon, color, display_order, created_at, updated_at)
     VALUES (?, 'Daily', 'book-open', ?, 0, ?, ?)`,
		[generateId(), DEFAULT_JOURNAL_COLOR, now, now],
	);
}
