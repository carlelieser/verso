import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = ExpoSQLiteDatabase<any>;

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { createDatabase } from '@/db/client';
import { setupFts } from '@/db/fts';
import { useRunMigrations } from '@/db/migrations';
import { ensureGuestUser } from '@/db/seed';

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

interface DatabaseProviderProps {
  readonly children: React.ReactNode;
}

export function DatabaseProvider({ children }: DatabaseProviderProps): React.JSX.Element {
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
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-lg font-semibold text-danger">Failed to initialize database</Text>
        <Text className="mt-2 px-8 text-center text-sm text-muted">{initError.message}</Text>
      </View>
    );
  }

  if (!db) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
        <Text className="mt-3 text-base text-muted">Initializing...</Text>
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
  const [isSeeded, setIsSeeded] = useState(false);
  const [seedError, setSeedError] = useState<Error | null>(null);

  useEffect(() => {
    if (success) {
      setupFts(db);
      ensureGuestUser(db)
        .then(() => {
          setIsSeeded(true);
        })
        .catch((err: unknown) => {
          setSeedError(err instanceof Error ? err : new Error(String(err)));
        });
    }
  }, [success, db]);

  if (error ?? seedError) {
    const displayError = error ?? seedError;
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-lg font-semibold text-danger">
          {error ? 'Migration failed' : 'Database setup failed'}
        </Text>
        <Text className="mt-2 px-8 text-center text-sm text-muted">{displayError?.message}</Text>
      </View>
    );
  }

  if (!success || !isSeeded) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
        <Text className="mt-3 text-base text-muted">
          {success ? 'Setting up...' : 'Running migrations...'}
        </Text>
      </View>
    );
  }

  return <DatabaseContext.Provider value={{ db }}>{children}</DatabaseContext.Provider>;
}
