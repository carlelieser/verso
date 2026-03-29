import { useCallback, useEffect, useRef } from 'react';

import { useDatabaseContext } from '@/providers/database-provider';
import { updateEntry } from '@/services/entry-service';

const DEBOUNCE_MS = 500;

interface AutoSaveRefs {
	readonly html: React.MutableRefObject<string>;
	readonly text: React.MutableRefObject<string>;
}

interface UseAutoSaveResult {
	readonly markDirty: () => void;
}

/**
 * Debounced auto-save for entry content.
 * Reads from refs when the timer fires — no state updates needed.
 * No-ops when entryId is null (entry not yet created).
 */
export function useAutoSave(entryId: string | null, content: AutoSaveRefs): UseAutoSaveResult {
	const { db } = useDatabaseContext();
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const markDirty = useCallback(() => {
		if (!entryId) return;

		if (timerRef.current) {
			clearTimeout(timerRef.current);
		}

		timerRef.current = setTimeout(() => {
			updateEntry(db, {
				id: entryId,
				contentHtml: content.html.current,
				contentText: content.text.current,
			}).catch((err: unknown) => {
				console.error('Auto-save failed:', err instanceof Error ? err.message : err);
			});
		}, DEBOUNCE_MS);
	}, [db, entryId, content]);

	useEffect(() => {
		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
		};
	}, []);

	return { markDirty };
}
