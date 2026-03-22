import React, {useState} from 'react';
import {Pressable, Text, TextInput, View} from 'react-native';

import {Button} from 'heroui-native';

import {JOURNAL_ICONS} from '@/constants/journal-icons';
import {useThemeColors} from '@/hooks/use-theme-colors';

interface CreateJournalProps {
	readonly onCreate: (name: string, icon: string) => void;
}

export function CreateJournal({onCreate}: CreateJournalProps): React.JSX.Element {
	const [name, setName] = useState('');
	const [selectedIcon, setSelectedIcon] = useState('book-open');
	const {accent, accentForeground, foreground, muted, surface, border} = useThemeColors();

	const isValid = name.trim().length > 0;

	return (
		<View style={{padding: 28, gap: 28}}>
			<Text className="text-3xl font-heading text-foreground pb-1">New Journal</Text>

			<View style={{gap: 8}}>
				<Text className="text-xs text-muted" style={{letterSpacing: 2}}>ICON</Text>
				<View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10}}>
					{JOURNAL_ICONS.map(({key, Icon}) => {
						const isSelected = selectedIcon === key;
						return (
							<Pressable
								key={key}
								onPress={() => setSelectedIcon(key)}
								style={{
									width: 44,
									height: 44,
									borderRadius: 12,
									alignItems: 'center',
									justifyContent: 'center',
									backgroundColor: isSelected ? accent : 'transparent',
									borderWidth: 1,
									borderColor: isSelected ? accent : border,
								}}
							>
								<Icon size={20} color={isSelected ? accentForeground : muted}/>
							</Pressable>
						);
					})}
				</View>
			</View>

			<View style={{gap: 8}}>
				<Text className="text-xs text-muted" style={{letterSpacing: 2}}>NAME</Text>
				<TextInput
					value={name}
					onChangeText={setName}
					placeholder="e.g. Daily, Work, Ideas..."
					placeholderTextColor={muted}
					autoFocus
					style={{
						backgroundColor: surface,
						borderRadius: 12,
						paddingHorizontal: 16,
						paddingVertical: 14,
						fontSize: 16,
						color: foreground,
						borderWidth: 1,
						borderColor: border,
					}}
				/>
			</View>

			<Button
				variant="primary"
				size="lg"
				isDisabled={!isValid}
				onPress={() => onCreate(name.trim(), selectedIcon)}
			>
				<Button.Label>Create</Button.Label>
			</Button>
		</View>
	);
}
