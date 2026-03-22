import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import type { Db } from '@/db/client';
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
  const [initAttempt, setInitAttempt] = useState(0);
  const [innerKey, setInnerKey] = useState(0);

  useEffect(() => {
    setInitError(null);
    createDatabase()
      .then((database) => {
        setDb(database);
      })
      .catch((error: unknown) => {
        setInitError(error instanceof Error ? error : new Error(String(error)));
      });
  }, [initAttempt]);

  if (initError) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-lg font-semibold text-danger">Failed to initialize database</Text>
        <Text className="mt-2 px-8 text-center text-sm text-muted">{initError.message}</Text>
        <Pressable
          onPress={() => setInitAttempt((n) => n + 1)}
          style={{ marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, backgroundColor: '#3b82f6' }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
        </Pressable>
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

  return <DatabaseProviderInner key={innerKey} db={db} onRetry={() => setInnerKey((k) => k + 1)}>{children}</DatabaseProviderInner>;
}

function DatabaseProviderInner({
  db,
  children,
  onRetry,
}: {
  readonly db: Db;
  readonly children: React.ReactNode;
  readonly onRetry: () => void;
}): React.JSX.Element {
  const { success, error } = useRunMigrations(db);
  const [isSeeded, setIsSeeded] = useState(false);
  const [seedError, setSeedError] = useState<Error | null>(null);
  const [seedAttempt, setSeedAttempt] = useState(0);

  useEffect(() => {
    if (success) {
      setSeedError(null);
      setupFts(db);
      ensureGuestUser(db)
        .then(() => {
          setIsSeeded(true);
        })
        .catch((err: unknown) => {
          setSeedError(err instanceof Error ? err : new Error(String(err)));
        });
    }
  }, [success, db, seedAttempt]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-lg font-semibold text-danger">Migration failed</Text>
        <Text className="mt-2 px-8 text-center text-sm text-muted">{error.message}</Text>
        <Pressable
          onPress={onRetry}
          style={{ marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, backgroundColor: '#3b82f6' }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (seedError) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-lg font-semibold text-danger">Database setup failed</Text>
        <Text className="mt-2 px-8 text-center text-sm text-muted">{seedError.message}</Text>
        <Pressable
          onPress={() => setSeedAttempt((n) => n + 1)}
          style={{ marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, backgroundColor: '#3b82f6' }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
        </Pressable>
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
