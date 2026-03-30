import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Portal } from '@gorhom/portal';
import { Button } from 'heroui-native';
import React, { useState } from 'react';

import { IconPicker } from '@/components/ui/icon-picker';
import { SheetContent } from '@/components/ui/sheet-content';
import { JOURNAL_ICONS } from '@/constants/journal-icons';
import { useBottomSheet } from '@/hooks/use-bottom-sheet';

interface ChangeJournalIconProps {
	readonly sheet: ReturnType<typeof useBottomSheet>;
	readonly currentIcon: string;
	readonly onChangeIcon: (icon: string) => void;
}

export function ChangeJournalIcon({
	sheet,
	currentIcon,
	onChangeIcon,
}: ChangeJournalIconProps): React.JSX.Element {
	const [selectedIcon, setSelectedIcon] = useState(currentIcon);

	const hasChanged = selectedIcon !== currentIcon;

	return (
		<Portal>
			<BottomSheet ref={sheet.ref} {...sheet.sheetProps}>
				<BottomSheetScrollView>
					<SheetContent
						title="Change Icon"
						footer={
							<Button
								variant="primary"
								isDisabled={!hasChanged}
								onPress={() => onChangeIcon(selectedIcon)}
							>
								<Button.Label>Save</Button.Label>
							</Button>
						}
					>
						<IconPicker
							icons={JOURNAL_ICONS}
							selectedKey={selectedIcon}
							onSelect={setSelectedIcon}
						/>
					</SheetContent>
				</BottomSheetScrollView>
			</BottomSheet>
		</Portal>
	);
}
