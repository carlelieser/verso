import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Portal } from '@gorhom/portal';
import { Button } from 'heroui-native';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { JOURNAL_ICONS } from '@/constants/journal-icons';
import { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface ChangeJournalIconProps {
	readonly sheet: ReturnType<typeof useBottomSheet>;
	readonly currentIcon: string;
	readonly onChangeIcon: (icon: string) => void;
}

export function ChangeJournalIcon({ sheet, currentIcon, onChangeIcon }: ChangeJournalIconProps): React.JSX.Element | null {
	const [selectedIcon, setSelectedIcon] = useState(currentIcon);
	const { accentForeground, muted } = useThemeColors();

	const hasChanged = selectedIcon !== currentIcon;

	if (!sheet.isOpen) return null;

	return (
		<Portal>
			<BottomSheet ref={sheet.ref} {...sheet.sheetProps}>
				<BottomSheetScrollView>
					<View className="p-6 gap-6">
						<Text className="text-3xl font-heading text-foreground pb-1">Change Icon</Text>

						<View className="flex-row flex-wrap gap-2">
							{JOURNAL_ICONS.map(({ key, Icon }) => {
								const isSelected = selectedIcon === key;
								return (
									<Pressable
										key={key}
										onPress={() => setSelectedIcon(key)}
										className={`w-11 h-11 rounded-xl items-center justify-center border ${
											isSelected ? 'bg-accent border-accent' : 'bg-transparent border-border'
										}`}
									>
										<Icon size={20} color={isSelected ? accentForeground : muted} />
									</Pressable>
								);
							})}
						</View>

						<View className="flex-row items-center justify-end">
							<Button variant="primary" isDisabled={!hasChanged} onPress={() => onChangeIcon(selectedIcon)}>
								<Button.Label>Save</Button.Label>
							</Button>
						</View>
					</View>
				</BottomSheetScrollView>
			</BottomSheet>
		</Portal>
	);
}
