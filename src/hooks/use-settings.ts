import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { Uniwind } from 'uniwind';

import {
	type Theme,
	SETTINGS_AUTO_LOCATION_KEY,
	SETTINGS_THEME_KEY,
	SETTINGS_TRANSCRIPTION_KEY,
	isValidTheme,
} from '@/constants/settings';

interface UseSettingsResult {
	readonly isAutoLocation: boolean;
	readonly isTranscriptionEnabled: boolean;
	readonly theme: Theme;
	readonly setSetting: (key: string, value: boolean) => void;
	readonly setTheme: (value: Theme) => void;
}

const BOOLEAN_DEFAULTS: Record<string, boolean> = {
	[SETTINGS_AUTO_LOCATION_KEY]: true,
	[SETTINGS_TRANSCRIPTION_KEY]: true,
};

const BOOLEAN_KEYS = [SETTINGS_AUTO_LOCATION_KEY, SETTINGS_TRANSCRIPTION_KEY] as const;

const DEFAULT_THEME: Theme = 'system';

function loadInitialBooleans(): Record<string, boolean> {
	const values: Record<string, boolean> = {};
	for (const key of BOOLEAN_KEYS) {
		const raw = SecureStore.getItem(key);
		values[key] = raw === null ? BOOLEAN_DEFAULTS[key]! : raw === 'true';
	}
	return values;
}


export function useSettings(): UseSettingsResult {
	const [boolValues, setBoolValues] = useState<Record<string, boolean>>(loadInitialBooleans);
	const initialTheme = SecureStore.getItem(SETTINGS_THEME_KEY);
	const [theme, setThemeState] = useState<Theme>(isValidTheme(initialTheme) ? initialTheme : DEFAULT_THEME);

	const load = useCallback(() => {
		Promise.all([
			...BOOLEAN_KEYS.map((key) => SecureStore.getItemAsync(key)),
			SecureStore.getItemAsync(SETTINGS_THEME_KEY),
		])
			.then((results) => {
				const loaded: Record<string, boolean> = {};
				for (let i = 0; i < BOOLEAN_KEYS.length; i++) {
					const key = BOOLEAN_KEYS[i]!;
					const raw = results[i];
					loaded[key] = raw === null ? BOOLEAN_DEFAULTS[key]! : raw === 'true';
				}
				setBoolValues(loaded);

				const themeRaw = results[BOOLEAN_KEYS.length] ?? null;
				if (isValidTheme(themeRaw)) {
					setThemeState(themeRaw);
				}
			})
			.catch((err: unknown) => {
				console.error('Failed to load settings:', err instanceof Error ? err.message : err);
			});
	}, []);

	useEffect(() => {
		const sub = AppState.addEventListener('change', (state) => {
			if (state === 'active') load();
		});
		return () => sub.remove();
	}, [load]);

	const setSetting = useCallback((key: string, value: boolean) => {
		setBoolValues((prev) => ({ ...prev, [key]: value }));
		SecureStore.setItemAsync(key, String(value)).catch((err: unknown) => {
			console.error('Failed to save setting:', err instanceof Error ? err.message : err);
		});
	}, []);

	const setTheme = useCallback((value: Theme) => {
		setThemeState(value);
		Uniwind.setTheme(value);
		SecureStore.setItemAsync(SETTINGS_THEME_KEY, value).catch((err: unknown) => {
			console.error('Failed to save theme:', err instanceof Error ? err.message : err);
		});
	}, []);

	return {
		isAutoLocation: boolValues[SETTINGS_AUTO_LOCATION_KEY] ?? false,
		isTranscriptionEnabled: boolValues[SETTINGS_TRANSCRIPTION_KEY] ?? true,
		theme,
		setSetting,
		setTheme,
	};
}
