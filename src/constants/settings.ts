export const SETTINGS_AUTO_LOCATION_KEY = 'settings.autoLocation';
export const SETTINGS_TRANSCRIPTION_KEY = 'settings.transcription';
export const SETTINGS_THEME_KEY = 'settings.theme';
export const SETTINGS_ONBOARDING_COMPLETE_KEY = 'settings.onboardingComplete';
export const SETTINGS_REMINDERS_ENABLED_KEY = 'settings.remindersEnabled';
export const SETTINGS_REMINDERS_TIME_KEY = 'settings.remindersTime';
export const SETTINGS_REMINDERS_DAYS_KEY = 'settings.remindersDays';
export const SETTINGS_SHOW_DONATION_BANNER_KEY = 'settings.showDonationBanner';

export type Theme = 'light' | 'dark' | 'system';

const VALID_THEMES = new Set<string>(['light', 'dark', 'system']);

export function isValidTheme(value: string | null): value is Theme {
	return value !== null && VALID_THEMES.has(value);
}
