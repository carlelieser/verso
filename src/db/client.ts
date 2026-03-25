import { getRandomBytes } from 'expo-crypto';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import { openDatabaseSync } from 'expo-sqlite';

import * as relations from './relations';
import * as schema from './schema';

const fullSchema = { ...schema, ...relations };
type Schema = typeof fullSchema;

export type Db = ExpoSQLiteDatabase<Schema>;

/**
 * Raw SQLite client interface for operations Drizzle doesn't support
 * (e.g. FTS5 virtual tables, raw PRAGMA).
 *
 * Type assertions are confined here — the rest of the codebase
 * accesses raw SQLite only through these helpers.
 */
interface RawSqliteClient {
	execSync: (sql: string) => void;
	runSync: (sql: string, params: unknown[]) => void;
	getAllSync: (sql: string, params: unknown[]) => unknown[];
	getAllAsync: (sql: string, params: unknown[]) => Promise<unknown[]>;
}

export function getRawClient(db: Db): RawSqliteClient {
	// Drizzle's expo-sqlite driver stores the raw client on $client.
	// This cast is at a system boundary — Drizzle doesn't expose a typed API for this.
	return (db as unknown as { $client: RawSqliteClient }).$client;
}

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
	const existingKey = await SecureStore.getItemAsync(ENCRYPTION_KEY_ALIAS);
	if (existingKey) {
		return existingKey;
	}

	const newKey = generateEncryptionKey();
	await SecureStore.setItemAsync(ENCRYPTION_KEY_ALIAS, newKey);
	return newKey;
}

export async function createDatabase(): Promise<Db> {
	const encryptionKey = await getOrCreateEncryptionKey();

	const sqliteDb = openDatabaseSync(DATABASE_NAME);

	sqliteDb.execSync(`PRAGMA key = '${encryptionKey.replace(/'/g, "''")}'`);
	sqliteDb.execSync('PRAGMA journal_mode = WAL');
	sqliteDb.execSync('PRAGMA synchronous = NORMAL');
	sqliteDb.execSync('PRAGMA cache_size = -8192');
	sqliteDb.execSync('PRAGMA foreign_keys = ON');
	sqliteDb.execSync('PRAGMA recursive_triggers = ON');

	return drizzle(sqliteDb, { schema: fullSchema });
}
