import { type LucideIcon } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { FlatList, type FlatListProps, View } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { SearchInput } from '@/components/ui/search-input';
import { useScreenInsets } from '@/contexts/screen-context';
import { useThemeColors } from '@/hooks/use-theme-colors';

const EMPTY_STATE_ICON_SIZE = 48;

interface EmptyStateConfig {
	readonly icon: LucideIcon;
	readonly title: string;
	readonly description?: string;
}

interface SearchableListProps<T>
	extends Pick<FlatListProps<T>, 'data' | 'keyExtractor' | 'renderItem'> {
	readonly filter?: (item: T, query: string) => boolean;
	readonly onQueryChange?: (query: string) => void;
	readonly searchPlaceholder?: string;
	readonly emptyState: EmptyStateConfig;
	readonly noResultsState: EmptyStateConfig;
	readonly headerAction?: React.ReactNode;
}

export function SearchableList<T>({
	data,
	keyExtractor,
	renderItem,
	filter,
	onQueryChange,
	searchPlaceholder,
	emptyState,
	noResultsState,
	headerAction,
}: SearchableListProps<T>): React.JSX.Element {
	const { contentInsetBottom } = useScreenInsets();
	const { muted } = useThemeColors();
	const [query, setQuery] = useState('');

	const handleQueryChange = (next: string) => {
		setQuery(next);
		onQueryChange?.(next);
	};

	const filteredData = useMemo(() => {
		if (!data) return data;
		if (!filter || query.trim().length === 0) return data;
		return Array.from(data).filter((item) => filter(item, query));
	}, [data, filter, query]);

	const hasQuery = query.length > 0;
	const empty = hasQuery ? noResultsState : emptyState;
	const EmptyIcon = empty.icon;

	return (
		<>
			<View className="mx-4 mb-2">
				<SearchInput
					value={query}
					onChangeText={handleQueryChange}
					placeholder={searchPlaceholder}
					endAdornment={headerAction}
				/>
			</View>

			<FlatList
				className="rounded-t-4xl overflow-hidden"
				data={filteredData}
				keyExtractor={keyExtractor}
				renderItem={renderItem}
				contentContainerClassName="pt-2 px-4 gap-3"
				contentContainerStyle={{ flexGrow: 1, paddingBottom: contentInsetBottom }}
				ListEmptyComponent={
					<EmptyState
						icon={<EmptyIcon size={EMPTY_STATE_ICON_SIZE} color={muted} />}
						title={empty.title}
						description={empty.description}
					/>
				}
			/>
		</>
	);
}
