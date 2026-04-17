import { useCallback } from 'react';

import { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { useConfirmDialog } from '@/providers/dialog-provider';

interface UseJournalActionsOptions {
	readonly journalId: string | undefined;
	readonly journalName?: string;
	readonly updateJournal: (
		id: string,
		updates: { name?: string; icon?: string; color?: string },
	) => Promise<void>;
	readonly setDefaultJournal: (id: string) => Promise<void>;
	readonly deleteJournal: (id: string) => Promise<void>;
	readonly onDeleted?: () => void;
}

interface UseJournalActionsResult {
	readonly renameSheet: ReturnType<typeof useBottomSheet>;
	readonly iconSheet: ReturnType<typeof useBottomSheet>;
	readonly colorSheet: ReturnType<typeof useBottomSheet>;
	readonly handleRename: (name: string) => Promise<void>;
	readonly handleChangeIcon: (icon: string) => Promise<void>;
	readonly handleChangeColor: (color: string) => Promise<void>;
	readonly handleSetDefault: () => Promise<void>;
	readonly handleDelete: () => Promise<void>;
}

export function useJournalActions({
	journalId,
	journalName,
	updateJournal,
	setDefaultJournal,
	deleteJournal,
	onDeleted,
}: UseJournalActionsOptions): UseJournalActionsResult {
	const dialog = useConfirmDialog();
	const renameSheet = useBottomSheet();
	const iconSheet = useBottomSheet();
	const colorSheet = useBottomSheet();

	const handleRename = useCallback(
		async (name: string) => {
			if (!journalId) return;
			await updateJournal(journalId, { name });
			renameSheet.close();
		},
		[journalId, updateJournal, renameSheet],
	);

	const handleChangeIcon = useCallback(
		async (icon: string) => {
			if (!journalId) return;
			await updateJournal(journalId, { icon });
			iconSheet.close();
		},
		[journalId, updateJournal, iconSheet],
	);

	const handleChangeColor = useCallback(
		async (color: string) => {
			if (!journalId) return;
			await updateJournal(journalId, { color });
			colorSheet.close();
		},
		[journalId, updateJournal, colorSheet],
	);

	const handleSetDefault = useCallback(async () => {
		if (!journalId) return;
		await setDefaultJournal(journalId);
	}, [journalId, setDefaultJournal]);

	const handleDelete = useCallback(async () => {
		if (!journalId) return;

		const confirmed = await dialog.confirm({
			title: 'Delete Journal',
			description: `All entries in "${
				journalName ?? 'this journal'
			}" will be permanently deleted. This cannot be undone.`,
			confirmLabel: 'Delete',
			variant: 'danger',
		});

		if (!confirmed) return;

		await deleteJournal(journalId);
		onDeleted?.();
	}, [journalId, journalName, deleteJournal, dialog, onDeleted]);

	return {
		renameSheet,
		iconSheet,
		colorSheet,
		handleRename,
		handleChangeIcon,
		handleChangeColor,
		handleSetDefault,
		handleDelete,
	};
}
