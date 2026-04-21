import { SearchField } from 'heroui-native';
import React from 'react';

interface SearchInputProps {
	readonly value: string;
	readonly onChangeText: (text: string) => void;
	readonly placeholder?: string;
	readonly endAdornment?: React.ReactNode;
}

export function SearchInput({
	value,
	onChangeText,
	placeholder,
	endAdornment,
}: SearchInputProps): React.JSX.Element {
	return (
		<SearchField value={value} onChange={onChangeText}>
			<SearchField.Group>
				<SearchField.SearchIcon />
				<SearchField.Input placeholder={placeholder} />
				<SearchField.ClearButton />
				{endAdornment}
			</SearchField.Group>
		</SearchField>
	);
}
