import { Search } from 'lucide-react-native';
import React from 'react';
import { TextInput, View } from 'react-native';

import { useThemeColors } from '@/hooks/use-theme-colors';

interface SearchInputProps {
	readonly value: string;
	readonly onChangeText: (text: string) => void;
	readonly placeholder?: string;
}

export function SearchInput({
	value,
	onChangeText,
	placeholder = 'Search...',
}: SearchInputProps): React.JSX.Element {
	const { muted, foreground } = useThemeColors();

	return (
		<View className="flex-row items-center mx-4 mb-2 px-3 py-2 bg-surface rounded-xl border border-border gap-2">
			<Search size={16} color={muted} />
			<TextInput
				value={value}
				onChangeText={onChangeText}
				placeholder={placeholder}
				placeholderTextColor={muted}
				className="flex-1 text-sm p-0"
				style={{ color: foreground }}
			/>
		</View>
	);
}
