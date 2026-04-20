import { SETTINGS_PIN_HASH_KEY, SETTINGS_PIN_SALT_KEY } from '@/constants/settings';
import { generateSalt, hashPin, timingSafeEqual } from '@/services/pin-crypto';
import { storage } from '@/services/storage';

export function hasPin(): boolean {
	return storage.has(SETTINGS_PIN_HASH_KEY);
}

export async function setPin(pin: string): Promise<void> {
	const salt = generateSalt();
	const hash = await hashPin(pin, salt);
	await storage.set(SETTINGS_PIN_SALT_KEY, salt);
	await storage.set(SETTINGS_PIN_HASH_KEY, hash);
}

export async function verifyPin(pin: string): Promise<boolean> {
	const [salt, stored] = await Promise.all([
		storage.getAsync(SETTINGS_PIN_SALT_KEY, ''),
		storage.getAsync(SETTINGS_PIN_HASH_KEY, ''),
	]);
	if (salt === '' || stored === '') return false;
	const computed = await hashPin(pin, salt);
	return timingSafeEqual(computed, stored);
}

export async function clearPin(): Promise<void> {
	await Promise.all([
		storage.remove(SETTINGS_PIN_HASH_KEY),
		storage.remove(SETTINGS_PIN_SALT_KEY),
	]);
}
