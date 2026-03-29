import BottomSheet, { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Portal } from '@gorhom/portal';
import { Button } from 'heroui-native';
import React, { useState } from 'react';
import { Text, View } from 'react-native';

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
					<View className="p-6 gap-6">
						<Text className="text-3xl font-heading text-foreground pb-1">
							Rename Journal
						</Text>

						<BottomSheetTextInput
							value={name}
							onChangeText={setName}
							placeholder="Journal name"
							placeholderTextColor={muted}
							autoFocus
							className="bg-surface rounded-xl px-4 py-3 text-base border border-border"
							style={{ color: foreground }}
						/>

						<View className="flex-row items-center justify-end">
							<Button
								variant="primary"
								isDisabled={!isValid}
								onPress={() => onRename(name.trim())}
							>
								<Button.Label>Save</Button.Label>
							</Button>
						</View>
					</View>
				</BottomSheetScrollView>
			</BottomSheet>
		</Portal>
	);
}
