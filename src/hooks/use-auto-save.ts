import { useCallback, useEffect, useRef, useState } from 'react';
import { useMemo } from 'react';

import { useDatabaseContext } from '@/providers/database-provider';
import { createEntryService } from '@/services/entry-service';

const DEBOUNCE_MS = 500;

interface UseAutoSaveResult {
  readonly isDirty: boolean;
  readonly isSaving: boolean;
  readonly save: (contentHtml: string, contentText: string) => void;
  readonly flush: () => Promise<void>;
}

export function useAutoSave(entryId: string | null): UseAutoSaveResult {
  const { db } = useDatabaseContext();
  const service = useMemo(() => createEntryService(db), [db]);

  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<{ contentHtml: string; contentText: string } | null>(null);

  const doSave = useCallback(async () => {
    if (!entryId || !pendingRef.current) return;

    const { contentHtml, contentText } = pendingRef.current;
    pendingRef.current = null;

    try {
      setIsSaving(true);
      await service.updateContent(entryId, { contentHtml, contentText });
      setIsDirty(false);
    } catch {
      // Re-queue failed save
      pendingRef.current = { contentHtml, contentText };
    } finally {
      setIsSaving(false);
    }
  }, [entryId, service]);

  const save = useCallback(
    (contentHtml: string, contentText: string) => {
      pendingRef.current = { contentHtml, contentText };
      setIsDirty(true);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        doSave();
      }, DEBOUNCE_MS);
    },
    [doSave],
  );

  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    await doSave();
  }, [doSave]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { isDirty, isSaving, save, flush };
}
