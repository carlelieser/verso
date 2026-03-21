import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

import migrations from '../../drizzle/migrations';

export function useRunMigrations(db: ExpoSQLiteDatabase): {
  success: boolean;
  error?: Error | undefined;
} {
  return useMigrations(db, migrations);
}
