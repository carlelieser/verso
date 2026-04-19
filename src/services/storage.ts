import * as SecureStore from 'expo-secure-store';

import { log } from '@/utils/log';

function serialize(value: unknown): string {
	if (typeof value === 'string') return value;
	if (typeof value === 'boolean' || typeof value === 'number') return String(value);
	return JSON.stringify(value);
}

function deserialize<T>(raw: string): T {
	try {
		return JSON.parse(raw) as T;
	} catch {
		return String(raw) as T
	}
}

function error(key: string, err: unknown): void {
	log.error('storage', `Failed to persist ${key}`, err);
}

export const storage = {
	get<T>(key: string, fallback: T): T {
		const raw = SecureStore.getItem(key);
		return raw === null ? fallback : deserialize(raw);
	},

	async getAsync<T>(key: string, fallback: T): Promise<T> {
		const raw = await SecureStore.getItemAsync(key);
		return raw === null ? fallback : deserialize(raw);
	},

	async set(key: string, value: unknown): Promise<void> {
		try {
			await SecureStore.setItemAsync(key, serialize(value));
		} catch (err: unknown) {
			error(key, err);
		}
	},

	has(key: string): boolean {
		return SecureStore.getItem(key) !== null;
	},

	async remove(key: string): Promise<void> {
		try {
			await SecureStore.deleteItemAsync(key);
		} catch (err: unknown) {
			error(key, err);
		}
	},
};
