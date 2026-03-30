import { useCallback } from 'react';

import { useConfirmDialog } from '@/providers/dialog-provider';

interface UseDeleteEntryResult {
	readonly confirmDeleteEntry: (entryId: string) => Promise<boolean>;
}

/**
 * Returns a confirmation helper for entry deletion.
 * Shows a danger dialog and calls `onDelete` if confirmed.
 * Returns true if the entry was deleted.
 */
export function useDeleteEntry(
	onDelete: (id: string) => Promise<void>,
): UseDeleteEntryResult {
	const dialog = useConfirmDialog();

	const confirmDeleteEntry = useCallback(
		async (entryId: string): Promise<boolean> => {
			const confirmed = await dialog.confirm({
				title: 'Delete Entry',
				description: 'This entry will be permanently deleted. This cannot be undone.',
				confirmLabel: 'Delete',
				variant: 'danger',
			});

			if (!confirmed) return false;

			await onDelete(entryId);
			return true;
		},
		[onDelete, dialog],
	);

	return { confirmDeleteEntry };
}
