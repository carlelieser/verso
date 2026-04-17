import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import type { Db } from '@/db/client';
import { createDatabase } from '@/db/client';
import { setupFts } from '@/db/fts';
import { ensureDefaultJournal } from '@/db/seed';

import migrations from '../../drizzle/migrations';

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
	readonly onReady?: () => void;
	readonly children: React.ReactNode;
}

function MigratedDatabase({
	db,
	onReady,
	children,
}: {
	readonly db: Db;
	readonly onReady?: () => void;
	readonly children: React.ReactNode;
}): React.JSX.Element {
	const { success, error } = useMigrations(db, migrations);
	const [ready, setReady] = useState(false);
	const [seedError, setSeedError] = useState<Error | null>(null);

	useEffect(() => {
		if (!success) return;
		try {
			setupFts(db);
			ensureDefaultJournal(db);
			setReady(true);
			onReady?.();
		} catch (err: unknown) {
			setSeedError(err instanceof Error ? err : new Error(String(err)));
		}
	}, [success, db, onReady]);

	if (error ?? seedError) {
		const message = (error ?? seedError)!.message;
		return (
			<View className="flex-1 items-center justify-center bg-background">
				<Text className="text-lg font-semibold text-danger">
					Failed to initialize database
				</Text>
				<Text className="mt-2 px-8 text-center text-sm text-muted">{message}</Text>
			</View>
		);
	}

	if (!ready) return <></>;

	return <DatabaseContext.Provider value={{ db }}>{children}</DatabaseContext.Provider>;
}

export function DatabaseProvider({ onReady, children }: DatabaseProviderProps): React.JSX.Element {
	const [db, setDb] = useState<Db | null>(null);
	const [error, setError] = useState<Error | null>(null);
	const [attempt, setAttempt] = useState(0);

	useEffect(() => {
		setError(null);
		createDatabase()
			.then(setDb)
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

	if (!db) return <></>;

	return <MigratedDatabase db={db} onReady={onReady}>{children}</MigratedDatabase>;
}
