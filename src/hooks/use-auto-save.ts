import { useEffect, useRef } from 'react';

import { useDatabaseContext } from '@/providers/database-provider';
import { updateEntry } from '@/services/entry-service';

const DEBOUNCE_MS = 500;

interface AutoSaveContent {
  readonly html: string;
  readonly text: string;
}

/**
 * Debounced auto-save for entry content.
 * No-ops when entryId is null (entry not yet created).
 * The caller should track html/text in refs and pass current values.
 */
export function useAutoSave(entryId: string | null, content: AutoSaveContent): void {
  const { db } = useDatabaseContext();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef(content);
  latestRef.current = content;

  useEffect(() => {
    if (!entryId) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      const { html, text } = latestRef.current;
      updateEntry(db, { id: entryId, contentHtml: html, contentText: text });
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [db, entryId, content.html, content.text]);
}
