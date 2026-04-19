import { useCallback, useEffect, useRef } from 'react';

import { useDatabaseContext } from '@/providers/database-provider';
import { updateEntry } from '@/services/entry-service';
import { log } from '@/utils/log';

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

	const isDirtyRef = useRef(false);

	const markDirty = useCallback(() => {
		if (!entryId) return;

		isDirtyRef.current = true;

		if (timerRef.current) {
			clearTimeout(timerRef.current);
		}

		timerRef.current = setTimeout(() => {
			isDirtyRef.current = false;
			updateEntry(db, {
				id: entryId,
				contentHtml: content.html.current,
				contentText: content.text.current,
			}).catch((err: unknown) => {
				log.error('auto-save', 'Auto-save failed', err);
			});
		}, DEBOUNCE_MS);
	}, [db, entryId, content]);

	const dbRef = useRef(db);
	dbRef.current = db;

	const entryIdRef = useRef(entryId);
	entryIdRef.current = entryId;

	const contentRef = useRef(content);
	contentRef.current = content;

	useEffect(() => {
		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}

			// Flush pending content on unmount so no writes are lost
			if (!isDirtyRef.current) return;
			const id = entryIdRef.current;
			const { html, text } = contentRef.current;
			if (id && html.current) {
				updateEntry(dbRef.current, {
					id,
					contentHtml: html.current,
					contentText: text.current,
				}).catch((err: unknown) => {
					log.error('auto-save', 'Auto-save flush failed', err);
				});
			}
		};
	}, []);

	return { markDirty };
}
