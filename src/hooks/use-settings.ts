import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { Uniwind } from 'uniwind';

import {
	type Theme,
	SETTINGS_AUTO_LOCATION_KEY,
	SETTINGS_REMINDERS_DAYS_KEY,
	SETTINGS_REMINDERS_ENABLED_KEY,
	SETTINGS_REMINDERS_TIME_KEY,
	SETTINGS_THEME_KEY,
	SETTINGS_TRANSCRIPTION_KEY,
	isValidTheme,
} from '@/constants/settings';
import { padTime } from '@/utils/format-time';

interface ReminderSettings {
	readonly isEnabled: boolean;
	readonly hour: number;
	readonly minute: number;
	readonly days: readonly number[];
}

interface UseSettingsResult {
	readonly isAutoLocation: boolean;
	readonly isTranscriptionEnabled: boolean;
	readonly reminders: ReminderSettings;
	readonly theme: Theme;
	readonly setSetting: (key: string, value: boolean) => void;
	readonly setReminderTime: (hour: number, minute: number) => void;
	readonly setReminderDays: (days: readonly number[]) => void;
	readonly setTheme: (value: Theme) => void;
}

const BOOLEAN_DEFAULTS: Record<string, boolean> = {
	[SETTINGS_AUTO_LOCATION_KEY]: true,
	[SETTINGS_TRANSCRIPTION_KEY]: true,
	[SETTINGS_REMINDERS_ENABLED_KEY]: false,
};

const BOOLEAN_KEYS = [
	SETTINGS_AUTO_LOCATION_KEY,
	SETTINGS_TRANSCRIPTION_KEY,
	SETTINGS_REMINDERS_ENABLED_KEY,
] as const;

const DEFAULT_REMINDER_TIME = '21:00';
const DEFAULT_REMINDER_DAYS: readonly number[] = [0, 1, 2, 3, 4, 5, 6];

function parseReminderTime(raw: string | null): { hour: number; minute: number } {
	if (raw === null) raw = DEFAULT_REMINDER_TIME;
	const [h, m] = raw.split(':');
	const hour = Number(h);
	const minute = Number(m);
	if (Number.isNaN(hour) || Number.isNaN(minute)) return { hour: 21, minute: 0 };
	return { hour, minute };
}

function parseReminderDays(raw: string | null): readonly number[] {
	if (raw === null) return DEFAULT_REMINDER_DAYS;
	try {
		const parsed: unknown = JSON.parse(raw);
		if (Array.isArray(parsed)) return parsed as number[];
	} catch {
		// fall through
	}
	return DEFAULT_REMINDER_DAYS;
}

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
	const [theme, setThemeState] = useState<Theme>(
		isValidTheme(initialTheme) ? initialTheme : DEFAULT_THEME,
	);
	const [reminderTime, setReminderTimeState] = useState(() =>
		parseReminderTime(SecureStore.getItem(SETTINGS_REMINDERS_TIME_KEY)),
	);
	const [reminderDays, setReminderDaysState] = useState(() =>
		parseReminderDays(SecureStore.getItem(SETTINGS_REMINDERS_DAYS_KEY)),
	);

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

	const setReminderTime = useCallback((hour: number, minute: number) => {
		setReminderTimeState({ hour, minute });
		SecureStore.setItemAsync(SETTINGS_REMINDERS_TIME_KEY, `${hour}:${padTime(minute)}`).catch(
			(err: unknown) => {
				console.error('Failed to save reminder time:', err instanceof Error ? err.message : err);
			},
		);
	}, []);

	const setReminderDays = useCallback((days: readonly number[]) => {
		setReminderDaysState(days);
		SecureStore.setItemAsync(SETTINGS_REMINDERS_DAYS_KEY, JSON.stringify(days)).catch(
			(err: unknown) => {
				console.error('Failed to save reminder days:', err instanceof Error ? err.message : err);
			},
		);
	}, []);

	return {
		isAutoLocation: boolValues[SETTINGS_AUTO_LOCATION_KEY] ?? false,
		isTranscriptionEnabled: boolValues[SETTINGS_TRANSCRIPTION_KEY] ?? true,
		reminders: {
			isEnabled: boolValues[SETTINGS_REMINDERS_ENABLED_KEY] ?? false,
			hour: reminderTime.hour,
			minute: reminderTime.minute,
			days: reminderDays,
		},
		theme,
		setSetting,
		setReminderTime,
		setReminderDays,
		setTheme,
	};
}
