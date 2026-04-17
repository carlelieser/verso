import { ArrowUpRight, FolderInput, Trash2 } from 'lucide-react-native';
import { useMemo } from 'react';

import type { ActionSheetItem } from '@/components/ui/action-sheet';
import { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { useJournals } from '@/hooks/use-journals';
import { useMoveEntry } from '@/hooks/use-move-entry';

interface UseEntryActionsOptions {
	readonly entryId: string | null | undefined;
	readonly onView: () => void;
	readonly onDelete: () => void;
}

interface UseEntryActionsResult {
	readonly actionItems: readonly ActionSheetItem[];
	readonly moveSheet: ReturnType<typeof useBottomSheet>;
	readonly moveEntry: (journalId: string) => Promise<void>;
}

export function useEntryActions({
	entryId,
	onView,
	onDelete,
}: UseEntryActionsOptions): UseEntryActionsResult {
	const { journals } = useJournals();
	const { moveSheet, moveEntry: moveEntryById } = useMoveEntry();

	const canMove = journals.length > 1;

	const moveEntry = useMemo(
		() => async (journalId: string) => {
			if (!entryId) return;
			await moveEntryById(entryId, journalId);
		},
		[entryId, moveEntryById],
	);

	const actionItems: readonly ActionSheetItem[] = useMemo(
		() => [
			{
				id: 'view',
				label: 'View',
				icon: ArrowUpRight,
				onPress: onView,
			},
			...(canMove
				? [
						{
							id: 'move',
							label: 'Move',
							icon: FolderInput,
							onPress: moveSheet.open,
						} satisfies ActionSheetItem,
				  ]
				: []),
			{
				id: 'delete',
				label: 'Delete',
				icon: Trash2,
				variant: 'danger' as const,
				onPress: onDelete,
			},
		],
		[onView, onDelete, canMove, moveSheet.open],
	);

	return { actionItems, moveSheet, moveEntry };
}
