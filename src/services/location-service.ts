import { eq } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import * as ExpoLocation from 'expo-location';

import { locations } from '@/db/schema';
import type { Location } from '@/types/attachment';
import { generateId } from '@/utils/id';

interface LocationService {
  readonly setManual: (entryId: string, name: string) => Promise<Location>;
  readonly setFromDevice: (entryId: string) => Promise<Location>;
  readonly getByEntry: (entryId: string) => Promise<Location | undefined>;
  readonly remove: (entryId: string) => Promise<void>;
}

/**
 * Creates a LocationService for attaching geographic metadata to journal entries.
 *
 * @param db - The Expo SQLite database instance
 * @returns A LocationService for managing entry locations
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createLocationService(db: ExpoSQLiteDatabase<any>): LocationService {
  async function upsertLocation(
    entryId: string,
    name: string,
    latitude: number | null,
    longitude: number | null,
  ): Promise<Location> {
    // Remove existing location for this entry (unique constraint)
    await db.delete(locations).where(eq(locations.entryId, entryId));

    const id = generateId();
    const now = Date.now();

    const location: Location = {
      id,
      entryId,
      name,
      latitude,
      longitude,
      createdAt: now,
    };

    await db.insert(locations).values({
      id,
      entryId,
      name,
      latitude,
      longitude,
      createdAt: new Date(now),
    });

    return location;
  }

  return {
    async setManual(entryId, name): Promise<Location> {
      return upsertLocation(entryId, name, null, null);
    },

    async setFromDevice(entryId): Promise<Location> {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      const position = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });

      const { latitude, longitude } = position.coords;

      const reverseResults = await ExpoLocation.reverseGeocodeAsync({ latitude, longitude });
      const first = reverseResults[0];

      let name = 'Unknown location';
      if (first !== undefined) {
        const parts = [first.city, first.region, first.country].filter(
          (part): part is string => part !== null && part !== undefined,
        );
        if (parts.length > 0) {
          name = parts.join(', ');
        }
      }

      return upsertLocation(entryId, name, latitude, longitude);
    },

    async getByEntry(entryId): Promise<Location | undefined> {
      const rows = await db
        .select()
        .from(locations)
        .where(eq(locations.entryId, entryId))
        .limit(1);

      const row = rows[0];
      return row ? toLocation(row) : undefined;
    },

    async remove(entryId): Promise<void> {
      await db.delete(locations).where(eq(locations.entryId, entryId));
    },
  };
}

function toLocation(row: typeof locations.$inferSelect): Location {
  return {
    id: row.id,
    entryId: row.entryId,
    name: row.name,
    latitude: row.latitude,
    longitude: row.longitude,
    createdAt: row.createdAt.getTime(),
  };
}
