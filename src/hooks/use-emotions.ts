import { useCallback, useEffect, useMemo, useState } from 'react';

import { useDatabaseContext } from '@/providers/database-provider';
import { createEmotionService } from '@/services/emotion-service';
import type { EmotionCategory, EmotionIntensity } from '@/types/common';
import type { EmotionInput, EmotionRecord } from '@/types/emotion';

interface SelectedEmotion {
  readonly category: EmotionCategory;
  readonly intensity: EmotionIntensity;
}

interface UseEmotionsResult {
  readonly selectedEmotions: readonly SelectedEmotion[];
  readonly savedRecords: readonly EmotionRecord[];
  readonly isLoading: boolean;
  readonly isSaving: boolean;
  readonly error: Error | null;
  readonly toggleEmotion: (category: EmotionCategory) => void;
  readonly setIntensity: (category: EmotionCategory, intensity: EmotionIntensity) => void;
  readonly saveEmotions: () => Promise<void>;
  readonly loadExisting: (entryId: string) => Promise<void>;
}

const DEFAULT_INTENSITY: EmotionIntensity = 3;

/**
 * Hook for managing emotion selection and persistence.
 *
 * @param entryId - The entry to associate emotions with
 * @returns Emotion state and mutation functions
 */
export function useEmotions(entryId: string | null): UseEmotionsResult {
  const { db } = useDatabaseContext();
  const service = useMemo(() => createEmotionService(db), [db]);

  const [selectedEmotions, setSelectedEmotions] = useState<readonly SelectedEmotion[]>([]);
  const [savedRecords, setSavedRecords] = useState<readonly EmotionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadExisting = useCallback(
    async (eid: string): Promise<void> => {
      try {
        setIsLoading(true);
        const records = await service.getByEntry(eid);
        setSavedRecords(records);

        if (records.length > 0) {
          setSelectedEmotions(
            records.map((r) => ({
              category: r.category,
              intensity: r.intensity,
            })),
          );
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    },
    [service],
  );

  useEffect(() => {
    if (entryId) {
      loadExisting(entryId);
    }
    // Only reload when entryId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryId]);

  const toggleEmotion = useCallback((category: EmotionCategory): void => {
    setSelectedEmotions((prev) => {
      const isAlreadySelected = prev.some((e) => e.category === category);
      if (isAlreadySelected) {
        return prev.filter((e) => e.category !== category);
      }
      return [...prev, { category, intensity: DEFAULT_INTENSITY }];
    });
  }, []);

  const setIntensity = useCallback((category: EmotionCategory, intensity: EmotionIntensity): void => {
    setSelectedEmotions((prev) =>
      prev.map((e) => (e.category === category ? { ...e, intensity } : e)),
    );
  }, []);

  const saveEmotions = useCallback(async (): Promise<void> => {
    if (!entryId) return;

    try {
      setIsSaving(true);
      setError(null);

      const inputs: readonly EmotionInput[] = selectedEmotions.map((e) => ({
        category: e.category,
        intensity: e.intensity,
      }));

      const records = await service.setEmotions(entryId, inputs);
      setSavedRecords(records);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsSaving(false);
    }
  }, [entryId, selectedEmotions, service]);

  return {
    selectedEmotions,
    savedRecords,
    isLoading,
    isSaving,
    error,
    toggleEmotion,
    setIntensity,
    saveEmotions,
    loadExisting,
  };
}
