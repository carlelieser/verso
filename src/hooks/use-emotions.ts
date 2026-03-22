import { useCallback } from 'react';

import { useDatabaseContext } from '@/providers/database-provider';
import {
  getEmotions as getEmotionsService,
  saveEmotions as saveEmotionsService,
} from '@/services/emotion-service';
import type { EmotionInput, EmotionRecord } from '@/types/emotion';

interface UseEmotionsResult {
  readonly saveEmotions: (entryId: string, emotions: readonly EmotionInput[]) => Promise<void>;
  readonly getEmotions: (entryId: string) => Promise<readonly EmotionRecord[]>;
}

export function useEmotions(): UseEmotionsResult {
  const { db } = useDatabaseContext();

  const saveEmotions = useCallback(
    async (entryId: string, emotions: readonly EmotionInput[]): Promise<void> => {
      await saveEmotionsService(db, entryId, emotions);
    },
    [db],
  );

  const getEmotions = useCallback(
    async (entryId: string): Promise<readonly EmotionRecord[]> => {
      return getEmotionsService(db, entryId);
    },
    [db],
  );

  return { saveEmotions, getEmotions };
}
