import { CryptoDigestAlgorithm, digestStringAsync, getRandomBytes } from 'expo-crypto';

import { SETTINGS_PIN_HASH_KEY, SETTINGS_PIN_SALT_KEY } from '@/constants/settings';
import { storage } from '@/services/storage';

function toHex(bytes: Uint8Array): string {
	let hex = '';
	for (let i = 0; i < bytes.length; i++) {
		const value = bytes[i] ?? 0;
		hex += value.toString(16).padStart(2, '0');
	}
	return hex;
}

function generateSalt(): string {
	return toHex(getRandomBytes(16));
}

async function hashPin(pin: string, salt: string): Promise<string> {
	return digestStringAsync(CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);
}

function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) {
		diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return diff === 0;
}

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
