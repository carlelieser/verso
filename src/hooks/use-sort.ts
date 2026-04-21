import { useCallback, useMemo, useState } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface SortOption<T> {
	readonly key: string;
	readonly label: string;
	readonly compare: (a: T, b: T) => number;
}

interface UseSortOptions<T> {
	readonly options: readonly SortOption<T>[];
	readonly defaultKey?: string;
	readonly defaultDirection?: SortDirection;
}

export interface UseSortResult<T> {
	readonly sortKey: string;
	readonly sortDirection: SortDirection;
	readonly options: readonly SortOption<T>[];
	readonly setSortKey: (key: string) => void;
	readonly toggleDirection: () => void;
	readonly sort: (data: readonly T[] | null | undefined) => readonly T[] | null | undefined;
}

export function useSort<T>({
	options,
	defaultKey,
	defaultDirection = 'desc',
}: UseSortOptions<T>): UseSortResult<T> {
	const [sortKey, setSortKey] = useState(defaultKey ?? options[0]?.key ?? '');
	const [sortDirection, setSortDirection] = useState<SortDirection>(defaultDirection);

	const toggleDirection = useCallback(() => {
		setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
	}, []);

	const sort = useCallback(
		(data: readonly T[] | null | undefined) => {
			if (!data) return data;
			const option = options.find((o) => o.key === sortKey);
			if (!option) return data;
			const multiplier = sortDirection === 'asc' ? 1 : -1;
			return Array.from(data).sort((a, b) => option.compare(a, b) * multiplier);
		},
		[options, sortKey, sortDirection],
	);

	return useMemo(
		() => ({
			sortKey,
			sortDirection,
			options,
			setSortKey,
			toggleDirection,
			sort,
		}),
		[sortKey, sortDirection, options, toggleDirection, sort],
	);
}
