import { eq } from 'drizzle-orm';

import type { Db } from '@/db/client';
import { locations } from '@/db/schema';
import type { Location, LocationInput } from '@/types/location';
import { generateId } from '@/utils/id';

export async function saveLocation(db: Db, entryId: string, input: LocationInput): Promise<void> {
	await db.delete(locations).where(eq(locations.entryId, entryId));

	const now = new Date();

	await db.insert(locations).values({
		id: generateId(),
		entryId,
		name: input.name,
		latitude: input.latitude,
		longitude: input.longitude,
		createdAt: now,
	});
}

export async function getLocation(db: Db, entryId: string): Promise<Location | null> {
	const [row] = await db.select().from(locations).where(eq(locations.entryId, entryId)).limit(1);

	if (!row) return null;

	return {
		id: row.id,
		entryId: row.entryId,
		name: row.name,
		latitude: row.latitude,
		longitude: row.longitude,
		createdAt: row.createdAt.getTime(),
	};
}
