import { createContext, useContext } from 'react';

interface ScreenInsets {
	readonly contentInsetBottom: number;
}

export const ScreenContext = createContext<ScreenInsets>({ contentInsetBottom: 0 });

export function useScreenInsets(): ScreenInsets {
	return useContext(ScreenContext);
}
