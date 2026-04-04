import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import type { Db } from '@/db/client';
import { createDatabase } from '@/db/client';
import { setupFts } from '@/db/fts';
import { ensureDefaultJournal } from '@/db/seed';

import migrations from '../../drizzle/migrations.js';

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
	const [error, setError] = useState<Error | null>(null);
	const [attempt, setAttempt] = useState(0);

	useEffect(() => {
		setError(null);
		createDatabase()
			.then(async (database) => {
				await migrate(database, migrations);
				setupFts(database);
				ensureDefaultJournal(database);
				setDb(database);
			})
			.catch((err: unknown) => {
				setError(err instanceof Error ? err : new Error(String(err)));
			});
	}, [attempt]);

	if (error) {
		return (
			<View className="flex-1 items-center justify-center bg-background">
				<Text className="text-lg font-semibold text-danger">
					Failed to initialize database
				</Text>
				<Text className="mt-2 px-8 text-center text-sm text-muted">{error.message}</Text>
				<Pressable
					onPress={() => setAttempt((n) => n + 1)}
					className="mt-4 px-6 py-2 rounded-lg bg-accent"
				>
					<Text className="text-accent-foreground font-semibold">Retry</Text>
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

	return <DatabaseContext.Provider value={{ db }}>{children}</DatabaseContext.Provider>;
}
