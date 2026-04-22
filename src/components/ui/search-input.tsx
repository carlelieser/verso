import { SearchField } from 'heroui-native';
import React, { memo } from 'react';
import { View } from 'react-native';

interface SearchInputProps {
	readonly value: string;
	readonly onChangeText: (text: string) => void;
	readonly placeholder?: string;
	readonly endAdornment?: React.ReactNode;
}

export const SearchInput = memo(function SearchInput({
	value,
	onChangeText,
	placeholder,
	endAdornment,
}: SearchInputProps): React.JSX.Element {
	return (
		<View className={'flex flex-row w-full items-center gap-2'}>
			<SearchField className={'w-full shrink'} value={value} onChange={onChangeText}>
				<SearchField.Group>
					<SearchField.SearchIcon />
					<SearchField.Input placeholder={placeholder} />
					<SearchField.ClearButton className={'mr-8'} />
					<View className={'absolute right-0 mr-1'}>{endAdornment}</View>
				</SearchField.Group>
			</SearchField>
		</View>
	);
});
