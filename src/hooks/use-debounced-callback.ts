import { useCallback, useEffect, useRef } from 'react';

const DEFAULT_DELAY_MS = 300;

/**
 * Returns a debounced version of the callback.
 * The latest call wins — earlier pending calls are cancelled.
 * The timer is cleared on unmount.
 */
export function useDebouncedCallback<Args extends readonly unknown[]>(
	callback: (...args: Args) => void,
	delayMs = DEFAULT_DELAY_MS,
): (...args: Args) => void {
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const callbackRef = useRef(callback);
	callbackRef.current = callback;

	useEffect(() => {
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, []);

	return useCallback(
		(...args: Args) => {
			if (timerRef.current) clearTimeout(timerRef.current);
			timerRef.current = setTimeout(() => callbackRef.current(...args), delayMs);
		},
		[delayMs],
	);
}
