import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { SETTINGS_AUTO_LOCATION_KEY, SETTINGS_TRANSCRIPTION_KEY } from '@/constants/settings';

interface Settings {
	readonly isAutoLocation: boolean;
	readonly isTranscriptionEnabled: boolean;
}

interface UseSettingsResult extends Settings {
	readonly setSetting: (key: string, value: boolean) => void;
}

const DEFAULTS: Record<string, boolean> = {
	[SETTINGS_AUTO_LOCATION_KEY]: true,
	[SETTINGS_TRANSCRIPTION_KEY]: true,
};

const KEYS = [SETTINGS_AUTO_LOCATION_KEY, SETTINGS_TRANSCRIPTION_KEY] as const;

export function useSettings(): UseSettingsResult {
	const [values, setValues] = useState<Record<string, boolean>>(DEFAULTS);

	const load = useCallback(() => {
		Promise.all(KEYS.map((key) => SecureStore.getItemAsync(key)))
			.then((results) => {
				const loaded: Record<string, boolean> = {};
				for (let i = 0; i < KEYS.length; i++) {
					const key = KEYS[i]!;
					const raw = results[i];
					loaded[key] = raw === null ? DEFAULTS[key]! : raw === 'true';
				}
				setValues(loaded);
			})
			.catch((err: unknown) => {
				console.error('Failed to load settings:', err instanceof Error ? err.message : err);
			});
	}, []);

	useEffect(() => {
		load();
		const sub = AppState.addEventListener('change', (state) => {
			if (state === 'active') load();
		});
		return () => sub.remove();
	}, [load]);

	const setSetting = useCallback((key: string, value: boolean) => {
		setValues((prev) => ({ ...prev, [key]: value }));
		SecureStore.setItemAsync(key, String(value)).catch((err: unknown) => {
			console.error('Failed to save setting:', err instanceof Error ? err.message : err);
		});
	}, []);

	return {
		isAutoLocation: values[SETTINGS_AUTO_LOCATION_KEY] ?? false,
		isTranscriptionEnabled: values[SETTINGS_TRANSCRIPTION_KEY] ?? true,
		setSetting,
	};
}
