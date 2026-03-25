import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Button } from 'heroui-native';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { JOURNAL_ICONS } from '@/constants/journal-icons';
import { Overline } from '@/components/overline';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface CreateJournalProps {
	readonly onCreate: (name: string, icon: string) => void;
}

export function CreateJournal({ onCreate }: CreateJournalProps): React.JSX.Element {
	const [name, setName] = useState('');
	const [selectedIcon, setSelectedIcon] = useState('book-open');
	const { accentForeground, foreground, muted } = useThemeColors();

	const isValid = name.trim().length > 0;

	return (
		<View className="p-6 gap-6">
			<Text className="text-3xl font-heading text-foreground pb-1">New Journal</Text>

			<View className="gap-2">
				<Overline>ICON</Overline>
				<View className="flex-row flex-wrap gap-2">
					{JOURNAL_ICONS.map(({ key, Icon }) => {
						const isSelected = selectedIcon === key;
						return (
							<Pressable
								key={key}
								onPress={() => setSelectedIcon(key)}
								className={`w-11 h-11 rounded-xl items-center justify-center border ${
									isSelected
										? 'bg-accent border-accent'
										: 'bg-transparent border-border'
								}`}
							>
								<Icon size={20} color={isSelected ? accentForeground : muted} />
							</Pressable>
						);
					})}
				</View>
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

			<View className="flex-row items-center justify-end">
				<Button
					variant="primary"
					isDisabled={!isValid}
					onPress={() => onCreate(name.trim(), selectedIcon)}
				>
					<Button.Label>Create</Button.Label>
				</Button>
			</View>
		</View>
	);
}
