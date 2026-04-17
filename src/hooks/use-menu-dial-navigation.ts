import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

interface MenuItem {
	readonly label: string;
	readonly value: string;
	readonly color?: string;
	readonly children?: MenuItem[];
}

interface UseMenuDialNavigationOptions {
	readonly items: MenuItem[];
	readonly onSelect: (path: string[]) => void;
	readonly onReset?: () => void;
}

interface BreadcrumbSegment {
	readonly label: string;
	readonly depth: number;
}

interface UseMenuDialNavigationReturn {
	readonly currentItems: MenuItem[];
	readonly currentLabel: string;
	readonly currentValue: string;
	readonly currentColor: string | undefined;
	readonly breadcrumbs: readonly BreadcrumbSegment[];
	readonly canGoBack: boolean;
	readonly highlightedIndex: number;
	readonly ringOpacity: SharedValue<number>;
	readonly ringScale: SharedValue<number>;
	readonly confirmItem: (index: number) => void;
	readonly selectCurrent: () => void;
	readonly navigateToDepth: (depth: number) => void;
	readonly goBack: () => void;
	readonly setHighlightedIndex: (index: number) => void;
}

const TRANSITION_OUT_DURATION = 150;
const TRANSITION_IN_DURATION = 200;

export function useMenuDialNavigation({
	items,
	onSelect,
	onReset,
}: UseMenuDialNavigationOptions): UseMenuDialNavigationReturn {
	const [stack, setStack] = useState<MenuItem[][]>([items]);
	const [pathValues, setPathValues] = useState<string[]>([]);
	const [highlightedIndex, setHighlightedIndex] = useState(0);

	const ringOpacity = useSharedValue(1);
	const ringScale = useSharedValue(1);

	const isTransitioning = useRef(false);
	const transitionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (transitionTimeout.current) clearTimeout(transitionTimeout.current);
		};
	}, []);

	const currentItems = stack[stack.length - 1]!;
	const currentLabel = currentItems[highlightedIndex]?.label ?? '';
	const currentValue = currentItems[highlightedIndex]?.value ?? '';
	const currentColor = currentItems[highlightedIndex]?.color;
	const canGoBack = stack.length > 1;

	// History segments only change on confirmed navigation, not on pan gestures.
	const historyBreadcrumbs = useMemo(() => {
		const segments: BreadcrumbSegment[] = [];
		for (let i = 0; i < pathValues.length; i++) {
			const levelItems = stack[i];
			const value = pathValues[i];
			const match = levelItems?.find((it) => it.value === value);
			if (match) {
				segments.push({ label: match.label, depth: i });
			}
		}
		return segments;
	}, [stack, pathValues]);

	const animateTransition = useCallback(
		(updateFn: () => void) => {
			if (isTransitioning.current) return;
			isTransitioning.current = true;

			if (transitionTimeout.current) clearTimeout(transitionTimeout.current);

			ringOpacity.value = withTiming(0, { duration: TRANSITION_OUT_DURATION });
			ringScale.value = withTiming(0.8, { duration: TRANSITION_OUT_DURATION });

			transitionTimeout.current = setTimeout(() => {
				updateFn();
				setHighlightedIndex(0);
				onReset?.();
				ringOpacity.value = withTiming(1, { duration: TRANSITION_IN_DURATION });
				ringScale.value = withTiming(1, { duration: TRANSITION_IN_DURATION });
				isTransitioning.current = false;
				transitionTimeout.current = null;
			}, TRANSITION_OUT_DURATION);
		},
		[ringOpacity, ringScale, onReset],
	);

	const confirmItem = useCallback(
		(index: number) => {
			const item = currentItems[index];
			if (!item) return;

			const children = item.children;
			if (children && children.length > 0) {
				animateTransition(() => {
					setStack((prev) => [...prev, children]);
					setPathValues((prev) => [...prev, item.value]);
				});
			} else {
				onSelect([...pathValues, item.value]);
				if (canGoBack) {
					animateTransition(() => {
						setStack([items]);
						setPathValues([]);
					});
				}
			}
		},
		[currentItems, animateTransition, onSelect, pathValues, canGoBack, items],
	);

	const selectCurrent = useCallback(() => {
		const item = currentItems[highlightedIndex];
		if (!item) return;

		onSelect([...pathValues, item.value]);

		if (canGoBack) {
			animateTransition(() => {
				setStack([items]);
				setPathValues([]);
			});
		}
	}, [currentItems, highlightedIndex, onSelect, pathValues, canGoBack, animateTransition, items]);

	const navigateToDepth = useCallback(
		(depth: number) => {
			if (depth >= stack.length - 1) return;

			animateTransition(() => {
				setStack((prev) => prev.slice(0, depth + 1));
				setPathValues((prev) => prev.slice(0, depth));
			});
		},
		[stack.length, animateTransition],
	);

	const goBack = useCallback(() => {
		if (!canGoBack) return;

		animateTransition(() => {
			setStack((prev) => prev.slice(0, -1));
			setPathValues((prev) => prev.slice(0, -1));
		});
	}, [canGoBack, animateTransition]);

	return useMemo(
		() => ({
			currentItems,
			currentLabel,
			currentValue,
			currentColor,
			breadcrumbs: [
				...historyBreadcrumbs,
				{ label: currentLabel, depth: pathValues.length },
			] as readonly BreadcrumbSegment[],
			canGoBack,
			highlightedIndex,
			ringOpacity,
			ringScale,
			confirmItem,
			selectCurrent,
			navigateToDepth,
			goBack,
			setHighlightedIndex,
		}),
		[
			currentItems,
			currentLabel,
			currentValue,
			currentColor,
			historyBreadcrumbs,
			pathValues.length,
			canGoBack,
			highlightedIndex,
			ringOpacity,
			ringScale,
			confirmItem,
			selectCurrent,
			navigateToDepth,
			goBack,
		],
	);
}

export type { MenuItem, UseMenuDialNavigationReturn };
