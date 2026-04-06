import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { Uniwind } from 'uniwind';

import {
	type Theme,
	SETTINGS_AUTO_LOCATION_KEY,
	SETTINGS_REMINDERS_DAYS_KEY,
	SETTINGS_REMINDERS_ENABLED_KEY,
	SETTINGS_REMINDERS_TIME_KEY,
	SETTINGS_SHOW_DONATION_BANNER_KEY,
	SETTINGS_THEME_KEY,
	SETTINGS_TRANSCRIPTION_KEY,
	isValidTheme,
} from '@/constants/settings';
import { getErrorMessage } from '@/utils/error';
import { padTime } from '@/utils/format-time';

export interface ReminderSettings {
	readonly isEnabled: boolean;
	readonly hour: number;
	readonly minute: number;
	readonly days: readonly number[];
}

export interface SettingsContextValue {
	readonly isAutoLocation: boolean;
	readonly isTranscriptionEnabled: boolean;
	readonly shouldShowDonationBanner: boolean;
	readonly reminders: ReminderSettings;
	readonly theme: Theme;
	readonly setSetting: (key: string, value: boolean) => void;
	readonly setReminderTime: (hour: number, minute: number) => void;
	readonly setReminderDays: (days: readonly number[]) => void;
	readonly setTheme: (value: Theme) => void;
}

export const SettingsContext = createContext<SettingsContextValue | null>(null);

const BOOLEAN_DEFAULTS: Record<string, boolean> = {
	[SETTINGS_AUTO_LOCATION_KEY]: true,
	[SETTINGS_TRANSCRIPTION_KEY]: true,
	[SETTINGS_REMINDERS_ENABLED_KEY]: false,
	[SETTINGS_SHOW_DONATION_BANNER_KEY]: true,
};

const BOOLEAN_KEYS = [
	SETTINGS_AUTO_LOCATION_KEY,
	SETTINGS_TRANSCRIPTION_KEY,
	SETTINGS_REMINDERS_ENABLED_KEY,
	SETTINGS_SHOW_DONATION_BANNER_KEY,
] as const;

const DEFAULT_REMINDER_TIME = '21:00';
const DEFAULT_REMINDER_DAYS: readonly number[] = [0, 1, 2, 3, 4, 5, 6];
const DEFAULT_THEME: Theme = 'system';

function parseReminderTime(raw: string | null): { hour: number; minute: number } {
	const value = raw ?? DEFAULT_REMINDER_TIME;
	const [h, m] = value.split(':');
	const hour = Number(h);
	const minute = Number(m);
	if (Number.isNaN(hour) || Number.isNaN(minute)) return { hour: 21, minute: 0 };
	return { hour, minute };
}

function parseReminderDays(raw: string | null): readonly number[] {
	if (raw === null) return DEFAULT_REMINDER_DAYS;
	try {
		const parsed: unknown = JSON.parse(raw);
		if (Array.isArray(parsed) && parsed.every((v) => typeof v === 'number')) {
			return parsed;
		}
	} catch {
		// fall through
	}
	return DEFAULT_REMINDER_DAYS;
}

function loadInitialBooleans(): Record<string, boolean> {
	const values: Record<string, boolean> = {};
	for (const key of BOOLEAN_KEYS) {
		const raw = SecureStore.getItem(key);
		values[key] = raw === null ? (BOOLEAN_DEFAULTS[key] ?? false) : raw === 'true';
	}
	return values;
}

interface SettingsProviderProps {
	readonly children: React.ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps): React.JSX.Element {
	const [boolValues, setBoolValues] = useState<Record<string, boolean>>(loadInitialBooleans);
	const [theme, setThemeState] = useState<Theme>(() => {
		const stored = SecureStore.getItem(SETTINGS_THEME_KEY);
		return isValidTheme(stored) ? stored : DEFAULT_THEME;
	});
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
					const key = BOOLEAN_KEYS[i];
					if (!key) continue;
					const raw = results[i];
					loaded[key] = raw === null ? (BOOLEAN_DEFAULTS[key] ?? false) : raw === 'true';
				}
				setBoolValues((prev) => {
					const hasChanged = BOOLEAN_KEYS.some((key) => prev[key] !== loaded[key]);
					return hasChanged ? loaded : prev;
				});

				const themeRaw = results[BOOLEAN_KEYS.length] ?? null;
				if (isValidTheme(themeRaw)) {
					setThemeState((prev) => (prev === themeRaw ? prev : themeRaw));
				}
			})
			.catch((err: unknown) => {
				console.error('Failed to load settings:', getErrorMessage(err));
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
			console.error('Failed to save setting:', getErrorMessage(err));
		});
	}, []);

	const setTheme = useCallback((value: Theme) => {
		setThemeState(value);
		Uniwind.setTheme(value);
		SecureStore.setItemAsync(SETTINGS_THEME_KEY, value).catch((err: unknown) => {
			console.error('Failed to save theme:', getErrorMessage(err));
		});
	}, []);

	const setReminderTime = useCallback((hour: number, minute: number) => {
		setReminderTimeState({ hour, minute });
		SecureStore.setItemAsync(SETTINGS_REMINDERS_TIME_KEY, `${hour}:${padTime(minute)}`).catch(
			(err: unknown) => {
				console.error('Failed to save reminder time:', getErrorMessage(err));
			},
		);
	}, []);

	const setReminderDays = useCallback((days: readonly number[]) => {
		setReminderDaysState(days);
		SecureStore.setItemAsync(SETTINGS_REMINDERS_DAYS_KEY, JSON.stringify(days)).catch(
			(err: unknown) => {
				console.error('Failed to save reminder days:', getErrorMessage(err));
			},
		);
	}, []);

	const isRemindersEnabled = boolValues[SETTINGS_REMINDERS_ENABLED_KEY] ?? false;
	const reminders = useMemo<ReminderSettings>(
		() => ({
			isEnabled: isRemindersEnabled,
			hour: reminderTime.hour,
			minute: reminderTime.minute,
			days: reminderDays,
		}),
		[isRemindersEnabled, reminderTime.hour, reminderTime.minute, reminderDays],
	);

	const value = useMemo<SettingsContextValue>(
		() => ({
			isAutoLocation: boolValues[SETTINGS_AUTO_LOCATION_KEY] ?? false,
			isTranscriptionEnabled: boolValues[SETTINGS_TRANSCRIPTION_KEY] ?? true,
			shouldShowDonationBanner: boolValues[SETTINGS_SHOW_DONATION_BANNER_KEY] ?? true,
			reminders,
			theme,
			setSetting,
			setReminderTime,
			setReminderDays,
			setTheme,
		}),
		[boolValues, reminders, theme, setSetting, setReminderTime, setReminderDays, setTheme],
	);

	return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
