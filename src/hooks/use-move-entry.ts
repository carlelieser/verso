import { useCallback } from 'react';

import { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { useDatabaseContext } from '@/providers/database-provider';
import { moveEntry as moveEntryService } from '@/services/entry-service';

interface UseMoveEntryResult {
	readonly moveSheet: ReturnType<typeof useBottomSheet>;
	readonly moveEntry: (entryId: string, journalId: string) => Promise<void>;
}

export function useMoveEntry(): UseMoveEntryResult {
	const { db } = useDatabaseContext();
	const moveSheet = useBottomSheet();

	const moveEntry = useCallback(
		async (entryId: string, journalId: string): Promise<void> => {
			await moveEntryService(db, entryId, journalId);
		},
		[db],
	);

	return { moveSheet, moveEntry };
}
