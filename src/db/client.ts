import { drizzle } from 'drizzle-orm/expo-sqlite';
import { getRandomBytes } from 'expo-crypto';
import { openDatabaseSync } from 'expo-sqlite';

import { storage } from '@/services/storage';

import * as relations from './relations';
import * as schema from './schema';
import type { Db } from './types';

const fullSchema = { ...schema, ...relations };

const ENCRYPTION_KEY_ALIAS = 'verso_db_key';
const DATABASE_NAME = 'verso.db';

function generateEncryptionKey(): string {
	const bytes = getRandomBytes(48);
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let key = '';
	for (let i = 0; i < bytes.length; i++) {
		key += chars.charAt(bytes[i]! % chars.length);
	}
	return key;
}

async function getOrCreateEncryptionKey(): Promise<string> {
	const existingKey = await storage.getAsync(ENCRYPTION_KEY_ALIAS, '');
	if (existingKey !== '') {
		return existingKey;
	}

	const newKey = generateEncryptionKey();
	await storage.set(ENCRYPTION_KEY_ALIAS, newKey);
	return newKey;
}

export async function createDatabase(): Promise<Db> {
	const encryptionKey = await getOrCreateEncryptionKey();

	const sqliteDb = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });

	sqliteDb.execSync(`PRAGMA key = '${encryptionKey.replace(/'/g, "''")}'`);
	sqliteDb.execSync('PRAGMA journal_mode = WAL');
	sqliteDb.execSync('PRAGMA synchronous = NORMAL');
	sqliteDb.execSync('PRAGMA cache_size = -8192');
	sqliteDb.execSync('PRAGMA foreign_keys = ON');
	sqliteDb.execSync('PRAGMA recursive_triggers = ON');

	return drizzle(sqliteDb, { schema: fullSchema });
}

export type { Db } from './types';
export { getRawClient } from './types';
