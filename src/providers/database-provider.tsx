import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

// Use `any` for schema generic to avoid type mismatch with createDatabase return
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = ExpoSQLiteDatabase<any>;
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/theme';
import { createDatabase } from '@/db/client';
import { setupFts } from '@/db/fts';
import { useRunMigrations } from '@/db/migrations';

interface DatabaseContextValue {
  readonly db: Db;
}

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

export function useDatabaseContext(): DatabaseContextValue {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabaseContext must be used within a DatabaseProvider');
  }
  return context;
}

export function DatabaseProvider({ children }: { readonly children: React.ReactNode }): React.JSX.Element {
  const [db, setDb] = useState<Db | null>(null);
  const [initError, setInitError] = useState<Error | null>(null);

  useEffect(() => {
    createDatabase()
      .then((database) => {
        setDb(database);
      })
      .catch((error: unknown) => {
        setInitError(error instanceof Error ? error : new Error(String(error)));
      });
  }, []);

  if (initError) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to initialize database</Text>
        <Text style={styles.errorDetail}>{initError.message}</Text>
      </View>
    );
  }

  if (!db) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  return <DatabaseProviderInner db={db}>{children}</DatabaseProviderInner>;
}

function DatabaseProviderInner({
  db,
  children,
}: {
  readonly db: Db;
  readonly children: React.ReactNode;
}): React.JSX.Element {
  const { success, error } = useRunMigrations(db);

  useEffect(() => {
    if (success) {
      setupFts(db);
    }
  }, [success, db]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Migration failed</Text>
        <Text style={styles.errorDetail}>{error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Running migrations...</Text>
      </View>
    );
  }

  return <DatabaseContext.Provider value={{ db }}>{children}</DatabaseContext.Provider>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.text.secondary,
    fontSize: 16,
  },
  errorText: {
    color: COLORS.status.error,
    fontSize: 18,
    fontWeight: '600',
  },
  errorDetail: {
    marginTop: 8,
    color: COLORS.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
