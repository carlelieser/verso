import BottomSheet, { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Portal } from '@gorhom/portal';
import { Button } from 'heroui-native';
import React, { useState } from 'react';
import { View } from 'react-native';

import { IconPicker } from '@/components/ui/icon-picker';
import { Overline } from '@/components/ui/overline';
import { SheetContent } from '@/components/ui/sheet-content';
import { JOURNAL_ICONS } from '@/constants/journal-icons';
import { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface CreateJournalProps {
	readonly sheet: ReturnType<typeof useBottomSheet>;
	readonly onCreate: (name: string, icon: string) => void;
}

export function CreateJournal({ sheet, onCreate }: CreateJournalProps): React.JSX.Element {
	const [name, setName] = useState('');
	const [selectedIcon, setSelectedIcon] = useState('book-open');
	const { foreground, muted } = useThemeColors();

	const isValid = name.trim().length > 0;

	return (
		<Portal>
			<BottomSheet ref={sheet.ref} {...sheet.sheetProps}>
				<BottomSheetScrollView keyboardShouldPersistTaps="handled">
					<SheetContent
						title="New Journal"
						footer={
							<Button
								variant="primary"
								isDisabled={!isValid}
								onPress={() => onCreate(name.trim(), selectedIcon)}
							>
								<Button.Label>Create</Button.Label>
							</Button>
						}
					>
						<View className="gap-2">
							<Overline>ICON</Overline>
							<IconPicker
								icons={JOURNAL_ICONS}
								selectedKey={selectedIcon}
								onSelect={setSelectedIcon}
							/>
						</View>

						<View className="gap-2">
							<Overline>NAME</Overline>
							<BottomSheetTextInput
								value={name}
								onChangeText={setName}
								placeholder="e.g. Daily, Work, Ideas..."
								placeholderTextColor={muted}
								autoFocus={true}
								className="bg-surface rounded-xl px-4 py-3 text-base border border-border"
								style={{ color: foreground }}
							/>
						</View>
					</SheetContent>
				</BottomSheetScrollView>
			</BottomSheet>
		</Portal>
	);
}
