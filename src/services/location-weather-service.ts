import * as ExpoLocation from 'expo-location';

import type { Db } from '@/db/client';
import { addLocationAttachment } from '@/services/attachment-service';
import { fetchWeather, saveWeather } from '@/services/weather-service';

/**
 * Captures the device's current location and weather, then persists both
 * for the given entry. Location is stored as an attachment. Weather is
 * stored separately. Silently no-ops if permissions are denied or the
 * location/weather fetch fails — metadata is best-effort.
 */
export async function captureLocationAndWeather(db: Db, entryId: string): Promise<void> {
	const { granted } = await ExpoLocation.getForegroundPermissionsAsync().catch(() => ({
		granted: false,
	}));
	if (!granted) return;

	const position =
		(await ExpoLocation.getLastKnownPositionAsync().catch(() => null)) ??
		(await ExpoLocation.getCurrentPositionAsync().catch(() => null));
	if (!position) return;

	const { latitude, longitude } = position.coords;

	const [reverseGeocode] = await ExpoLocation.reverseGeocodeAsync({ latitude, longitude }).catch(
		() => [null],
	);
	const name =
		[reverseGeocode?.city, reverseGeocode?.region].filter(Boolean).join(', ') || 'Unknown';

	await addLocationAttachment(db, { entryId, name, latitude, longitude });

	const weather = await fetchWeather(latitude, longitude).catch(() => null);
	if (weather) {
		await saveWeather(db, entryId, weather);
	}
}
