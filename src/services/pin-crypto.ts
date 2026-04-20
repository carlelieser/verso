import { CryptoDigestAlgorithm, digestStringAsync, getRandomBytes } from 'expo-crypto';

function toHex(bytes: Uint8Array): string {
	let hex = '';
	for (let i = 0; i < bytes.length; i++) {
		const value = bytes[i] ?? 0;
		hex += value.toString(16).padStart(2, '0');
	}
	return hex;
}

export function generateSalt(): string {
	return toHex(getRandomBytes(16));
}

export async function hashPin(pin: string, salt: string): Promise<string> {
	return digestStringAsync(CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);
}

export function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) {
		diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return diff === 0;
}
