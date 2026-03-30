import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Portal } from '@gorhom/portal';
import { Button } from 'heroui-native';
import React, { useState } from 'react';
import { Text, View } from 'react-native';

import { IconPicker } from '@/components/ui/icon-picker';
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
					<View className="p-6 gap-6">
						<Text className="text-3xl font-heading text-foreground pb-1">
							Change Icon
						</Text>

						<IconPicker
							icons={JOURNAL_ICONS}
							selectedKey={selectedIcon}
							onSelect={setSelectedIcon}
						/>

						<View className="flex-row items-center justify-end">
							<Button
								variant="primary"
								isDisabled={!hasChanged}
								onPress={() => onChangeIcon(selectedIcon)}
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
