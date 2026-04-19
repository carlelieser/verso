import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

import type * as relations from './relations';
import type * as schema from './schema';

type Schema = typeof schema & typeof relations;

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
