import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Button, Separator } from 'heroui-native';
import React from 'react';
import { Text, View } from 'react-native';

import { SheetContent } from '@/components/ui/sheet-content';
import { getJournalIcon } from '@/constants/journal-icons';
import { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { Journal } from '@/types/journal';

interface MoveToJournalSheetProps {
	readonly sheet: ReturnType<typeof useBottomSheet>;
	readonly journals: readonly Journal[];
	readonly currentJournalId: string;
	readonly onMove: (journalId: string) => void;
}

export function MoveToJournalSheet({
	sheet,
	journals,
	currentJournalId,
	onMove,
}: MoveToJournalSheetProps): React.JSX.Element | null {
	const { muted } = useThemeColors();

	if (!sheet.isOpen) return null;

	const targets = journals.filter((j) => j.id !== currentJournalId);

	return (
		<BottomSheet ref={sheet.ref} {...sheet.sheetProps}>
			<BottomSheetView>
				<SheetContent className="p-0 gap-1">
					<View className="px-4 py-3" pointerEvents="none">
						<Text className="text-sm font-medium text-muted">Journals</Text>
					</View>
					<Separator />
					{targets.map((journal) => {
						const Icon = getJournalIcon(journal.icon);
						return (
							<Button
								key={journal.id}
								variant="ghost"
								onPress={() => {
									sheet.close();
									onMove(journal.id);
								}}
								className="justify-start"
							>
								<Icon size={16} color={journal.color ?? muted} />
								<Text className="text-base text-foreground">{journal.name}</Text>
							</Button>
						);
					})}
				</SheetContent>
			</BottomSheetView>
		</BottomSheet>
	);
}
