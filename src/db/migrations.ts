import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';

import type { Db } from './client';
import migrations from '../../drizzle/migrations';

export function useRunMigrations(db: Db): {
  success: boolean;
  error?: Error | undefined;
} {
  return useMigrations(db, migrations);
}
