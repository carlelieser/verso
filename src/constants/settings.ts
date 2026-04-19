export const SETTINGS_AUTO_LOCATION_KEY = 'settings.autoLocation';
export const SETTINGS_TRANSCRIPTION_KEY = 'settings.transcription';
export const SETTINGS_VOICE_INPUT_KEY = 'settings.voiceInput';
export const SETTINGS_THEME_KEY = 'settings.theme';

export const STT_MODEL_URL =
	'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin';
export const STT_MODEL_FILENAME = 'ggml-tiny.en.bin';
export const SETTINGS_ONBOARDING_COMPLETE_KEY = 'settings.onboardingComplete';
export const SETTINGS_REMINDERS_ENABLED_KEY = 'settings.remindersEnabled';
export const SETTINGS_REMINDERS_TIME_KEY = 'settings.remindersTime';
export const SETTINGS_REMINDERS_DAYS_KEY = 'settings.remindersDays';
export const SETTINGS_SHOW_DONATION_BANNER_KEY = 'settings.showDonationBanner';

export const SETTINGS_PIN_HASH_KEY = 'security.pinHash';
export const SETTINGS_PIN_SALT_KEY = 'security.pinSalt';
export const SETTINGS_REQUIRE_PIN_KEY = 'security.requirePin';
export const SETTINGS_BIOMETRICS_KEY = 'security.useBiometrics';

export const PIN_MIN_LENGTH = 4;
export const PIN_MAX_LENGTH = 12;

export type Theme = 'light' | 'dark' | 'system';

const VALID_THEMES = new Set<string>(['light', 'dark', 'system']);

export function isValidTheme(value: string | null): value is Theme {
	return value !== null && VALID_THEMES.has(value);
}
