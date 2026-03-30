import BottomSheet, { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Portal } from '@gorhom/portal';
import { Button } from 'heroui-native';
import React, { useState } from 'react';

import { SheetContent } from '@/components/ui/sheet-content';
import { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface RenameJournalProps {
	readonly sheet: ReturnType<typeof useBottomSheet>;
	readonly currentName: string;
	readonly onRename: (name: string) => void;
}

export function RenameJournal({
	sheet,
	currentName,
	onRename,
}: RenameJournalProps): React.JSX.Element {
	const [name, setName] = useState(currentName);
	const { foreground, muted } = useThemeColors();

	const isValid = name.trim().length > 0 && name.trim() !== currentName;

	return (
		<Portal>
			<BottomSheet ref={sheet.ref} {...sheet.sheetProps}>
				<BottomSheetScrollView keyboardShouldPersistTaps="handled">
					<SheetContent
						title="Rename Journal"
						footer={
							<Button
								variant="primary"
								isDisabled={!isValid}
								onPress={() => onRename(name.trim())}
							>
								<Button.Label>Save</Button.Label>
							</Button>
						}
					>
						<BottomSheetTextInput
							value={name}
							onChangeText={setName}
							placeholder="Journal name"
							placeholderTextColor={muted}
							autoFocus
							className="bg-surface rounded-xl px-4 py-3 text-base border border-border"
							style={{ color: foreground }}
						/>
					</SheetContent>
				</BottomSheetScrollView>
			</BottomSheet>
		</Portal>
	);
}
