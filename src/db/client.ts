import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';

import * as relations from './relations';
import * as schema from './schema';

const ENCRYPTION_KEY_ALIAS = 'verso_db_key';
const DATABASE_NAME = 'verso.db';

function generateEncryptionKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < 64; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
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

export async function createDatabase(): Promise<ReturnType<typeof drizzle>> {
  const encryptionKey = await getOrCreateEncryptionKey();

  const sqliteDb = openDatabaseSync(DATABASE_NAME);

  sqliteDb.execSync(`PRAGMA key = '${encryptionKey}'`);
  sqliteDb.execSync('PRAGMA journal_mode = WAL');
  sqliteDb.execSync('PRAGMA synchronous = NORMAL');
  sqliteDb.execSync('PRAGMA cache_size = -8192');
  sqliteDb.execSync('PRAGMA foreign_keys = ON');

  const db = drizzle(sqliteDb, { schema: { ...schema, ...relations } });

  return db;
}
