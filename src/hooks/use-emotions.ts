import { useCallback, useState } from 'react';

import { useDatabaseContext } from '@/providers/database-provider';
import {
	getEmotions as getEmotionsService,
	saveEmotions as saveEmotionsService,
} from '@/services/emotion-service';
import type { EmotionInput, EmotionRecord } from '@/types/emotion';

interface UseEmotionsResult {
	readonly saveEmotions: (entryId: string, emotions: readonly EmotionInput[]) => Promise<void>;
	readonly getEmotions: (entryId: string) => Promise<readonly EmotionRecord[]>;
	readonly error: Error | null;
}

export function useEmotions(): UseEmotionsResult {
	const { db } = useDatabaseContext();
	const [error, setError] = useState<Error | null>(null);

	const saveEmotions = useCallback(
		async (entryId: string, emotions: readonly EmotionInput[]): Promise<void> => {
			try {
				setError(null);
				await saveEmotionsService(db, entryId, emotions);
			} catch (err) {
				setError(err instanceof Error ? err : new Error(String(err)));
				throw err;
			}
		},
		[db],
	);

	const getEmotions = useCallback(
		async (entryId: string): Promise<readonly EmotionRecord[]> => {
			try {
				setError(null);
				return await getEmotionsService(db, entryId);
			} catch (err) {
				setError(err instanceof Error ? err : new Error(String(err)));
				throw err;
			}
		},
		[db],
	);

	return { saveEmotions, getEmotions, error };
}
