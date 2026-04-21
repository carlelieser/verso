import { Platform } from 'react-native';

export const SETTINGS_AUTO_LOCATION_KEY = 'settings.autoLocation';
export const SETTINGS_VOICE_INPUT_KEY = 'settings.voiceInput';
export const SETTINGS_THEME_KEY = 'settings.theme';

export const STT_MODEL_URL =
	'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin';
export const STT_MODEL_FILENAME = STT_MODEL_URL.substring(STT_MODEL_URL.lastIndexOf('/') + 1);

export const STT_COREML_ENCODER_URL =
	'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en-encoder.mlmodelc.zip';

export const STT_COREML_ENCODER_ZIP_FILENAME = STT_COREML_ENCODER_URL.substring(
	STT_COREML_ENCODER_URL.lastIndexOf('/') + 1,
);

export const STT_MODEL_SIZE_BYTES = 77704715;
export const STT_COREML_ENCODER_SIZE_BYTES = 15034655;

const STT_TOTAL_DOWNLOAD_SIZE_BYTES =
	Platform.OS === 'ios'
		? STT_MODEL_SIZE_BYTES + STT_COREML_ENCODER_SIZE_BYTES
		: STT_MODEL_SIZE_BYTES;

export const STT_MODEL_DOWNLOAD_SIZE_LABEL = `~${Math.round(
	STT_TOTAL_DOWNLOAD_SIZE_BYTES / 1_000_000,
)} MB`;
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

export function isValidTheme(value: unknown): value is Theme {
	return typeof value === 'string' && VALID_THEMES.has(value);
}
