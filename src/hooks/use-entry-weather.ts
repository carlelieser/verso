import { eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMemo } from 'react';

import { weatherRecords } from '@/db/schema';
import { useDatabaseContext } from '@/providers/database-provider';
import type { Weather } from '@/types/weather';

export function useEntryWeather(entryId: string): Weather | null {
	const { db } = useDatabaseContext();

	const { data: rows } = useLiveQuery(
		db.select().from(weatherRecords).where(eq(weatherRecords.entryId, entryId)).limit(1),
		[entryId],
	);

	return useMemo(() => {
		const [row] = rows;
		if (!row) return null;
		return {
			id: row.id,
			entryId: row.entryId,
			temperature: row.temperature,
			condition: row.condition,
			humidity: row.humidity,
			windSpeed: row.windSpeed,
			createdAt: row.createdAt.getTime(),
		};
	}, [rows]);
}
