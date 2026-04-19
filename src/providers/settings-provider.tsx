import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { Uniwind } from 'uniwind';

import {
	type Theme,
	SETTINGS_AUTO_LOCATION_KEY,
	SETTINGS_BIOMETRICS_KEY,
	SETTINGS_REMINDERS_DAYS_KEY,
	SETTINGS_REMINDERS_ENABLED_KEY,
	SETTINGS_REMINDERS_TIME_KEY,
	SETTINGS_REQUIRE_PIN_KEY,
	SETTINGS_SHOW_DONATION_BANNER_KEY,
	SETTINGS_THEME_KEY,
	SETTINGS_VOICE_INPUT_KEY,
	isValidTheme,
} from '@/constants/settings';
import { storage } from '@/services/storage';
import { padTime } from '@/utils/format-time';
import { log } from '@/utils/log';

export interface ReminderSettings {
	readonly isEnabled: boolean;
	readonly hour: number;
	readonly minute: number;
	readonly days: readonly number[];
}

export interface SettingsContextValue {
	readonly isAutoLocation: boolean;
	readonly isVoiceInputEnabled: boolean;
	readonly shouldShowDonationBanner: boolean;
	readonly isRequirePin: boolean;
	readonly isBiometricsEnabled: boolean;
	readonly reminders: ReminderSettings;
	readonly theme: Theme;
	readonly setSetting: (key: string, value: boolean) => void;
	readonly setReminderTime: (hour: number, minute: number) => void;
	readonly setReminderDays: (days: readonly number[]) => void;
	readonly setTheme: (value: Theme) => void;
}

export const SettingsContext = createContext<SettingsContextValue | null>(null);

const DEFAULT_SETTINGS: Record<string, boolean> = {
	[SETTINGS_AUTO_LOCATION_KEY]: true,
	[SETTINGS_VOICE_INPUT_KEY]: false,
	[SETTINGS_REMINDERS_ENABLED_KEY]: false,
	[SETTINGS_SHOW_DONATION_BANNER_KEY]: true,
	[SETTINGS_REQUIRE_PIN_KEY]: false,
	[SETTINGS_BIOMETRICS_KEY]: false,
};

const SETTINGS_KEYS = [
	SETTINGS_AUTO_LOCATION_KEY,
	SETTINGS_VOICE_INPUT_KEY,
	SETTINGS_REMINDERS_ENABLED_KEY,
	SETTINGS_SHOW_DONATION_BANNER_KEY,
	SETTINGS_REQUIRE_PIN_KEY,
	SETTINGS_BIOMETRICS_KEY,
] as const;

const DEFAULT_REMINDER_TIME = '21:00';
const DEFAULT_REMINDER_DAYS: readonly number[] = [0, 1, 2, 3, 4, 5, 6];
const DEFAULT_THEME: Theme = 'system';

function parseReminderTime(raw: string): { hour: number; minute: number } {
	const [h, m] = raw.split(':');
	const hour = Number(h);
	const minute = Number(m);
	if (Number.isNaN(hour) || Number.isNaN(minute)) return { hour: 21, minute: 0 };
	return { hour, minute };
}

function loadDefaultSettings(): Record<string, boolean> {
	const values: Record<string, boolean> = {};
	for (const key of SETTINGS_KEYS) {
		values[key] = storage.get(key, DEFAULT_SETTINGS[key] ?? false);
	}
	return values;
}

interface SettingsProviderProps {
	readonly children: React.ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps): React.JSX.Element {
	const [values, setValues] = useState<Record<string, boolean>>(loadDefaultSettings);
	const [theme, setThemeState] = useState<Theme>(() => {
		const stored = storage.get(SETTINGS_THEME_KEY, DEFAULT_THEME);
		return isValidTheme(stored) ? stored : DEFAULT_THEME;
	});
	const [reminderTime, setReminderTimeState] = useState(() =>
		parseReminderTime(storage.get(SETTINGS_REMINDERS_TIME_KEY, DEFAULT_REMINDER_TIME)),
	);
	const [reminderDays, setReminderDaysState] = useState<readonly number[]>(() =>
		storage.get<readonly number[]>(SETTINGS_REMINDERS_DAYS_KEY, DEFAULT_REMINDER_DAYS),
	);

	const load = useCallback(() => {
		Promise.all([
			...SETTINGS_KEYS.map((key) =>
				storage.getAsync(key, DEFAULT_SETTINGS[key] ?? false),
			),
			storage.getAsync(SETTINGS_THEME_KEY, DEFAULT_THEME),
		])
			.then((results) => {
				const loaded: Record<string, boolean> = {};
				for (let i = 0; i < SETTINGS_KEYS.length; i++) {
					const key = SETTINGS_KEYS[i];
					if (!key) continue;
					loaded[key] = results[i] as boolean;
				}
				setValues((prev) => {
					const hasChanged = SETTINGS_KEYS.some((key) => prev[key] !== loaded[key]);
					return hasChanged ? loaded : prev;
				});

				const themeRaw = results[SETTINGS_KEYS.length];
				if (isValidTheme(themeRaw)) {
					setThemeState((prev) => (prev === themeRaw ? prev : themeRaw));
				}
			})
			.catch((err: unknown) => {
				log.error('settings', 'Failed to load settings', err);
			});
	}, []);

	useEffect(() => {
		const sub = AppState.addEventListener('change', (state) => {
			if (state === 'active') load();
		});
		return () => sub.remove();
	}, [load]);

	const setSetting = useCallback((key: string, value: boolean) => {
		setValues((prev) => ({ ...prev, [key]: value }));
		void storage.set(key, value);
	}, []);

	const setTheme = useCallback((value: Theme) => {
		setThemeState(value);
		Uniwind.setTheme(value);
		void storage.set(SETTINGS_THEME_KEY, value);
	}, []);

	const setReminderTime = useCallback((hour: number, minute: number) => {
		setReminderTimeState({ hour, minute });
		void storage.set(SETTINGS_REMINDERS_TIME_KEY, `${hour}:${padTime(minute)}`);
	}, []);

	const setReminderDays = useCallback((days: readonly number[]) => {
		setReminderDaysState(days);
		void storage.set(SETTINGS_REMINDERS_DAYS_KEY, days);
	}, []);

	const isRemindersEnabled = values[SETTINGS_REMINDERS_ENABLED_KEY] ?? false;
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
			isAutoLocation: values[SETTINGS_AUTO_LOCATION_KEY] ?? false,
			isVoiceInputEnabled: values[SETTINGS_VOICE_INPUT_KEY] ?? false,
			shouldShowDonationBanner: values[SETTINGS_SHOW_DONATION_BANNER_KEY] ?? true,
			isRequirePin: values[SETTINGS_REQUIRE_PIN_KEY] ?? false,
			isBiometricsEnabled: values[SETTINGS_BIOMETRICS_KEY] ?? false,
			reminders,
			theme,
			setSetting,
			setReminderTime,
			setReminderDays,
			setTheme,
		}),
		[values, reminders, theme, setSetting, setReminderTime, setReminderDays, setTheme],
	);

	return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
