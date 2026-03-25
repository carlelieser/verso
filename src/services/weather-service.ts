import { eq } from 'drizzle-orm';

import { getWeatherLabel } from '@/constants/weather-codes';
import type { Db } from '@/db/client';
import { weatherRecords } from '@/db/schema';
import type { Weather, WeatherInput } from '@/types/weather';
import { generateId } from '@/utils/id';

const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast';

interface OpenMeteoCurrentResponse {
	readonly current: {
		readonly temperature_2m: number;
		readonly weather_code: number;
		readonly relative_humidity_2m: number;
		readonly wind_speed_10m: number;
	};
}

export async function fetchWeather(latitude: number, longitude: number): Promise<WeatherInput> {
	const params = new URLSearchParams({
		latitude: String(latitude),
		longitude: String(longitude),
		current: 'temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m',
		temperature_unit: 'fahrenheit',
		wind_speed_unit: 'mph',
	});

	const response = await fetch(`${OPEN_METEO_BASE_URL}?${params.toString()}`);

	if (!response.ok) {
		throw new Error(`Open-Meteo request failed: ${response.status}`);
	}

	const data = (await response.json()) as OpenMeteoCurrentResponse;
	const current = data.current;

	return {
		temperature: current.temperature_2m,
		condition: getWeatherLabel(current.weather_code),
		humidity: current.relative_humidity_2m,
		windSpeed: current.wind_speed_10m,
	};
}

export async function saveWeather(db: Db, entryId: string, input: WeatherInput): Promise<void> {
	await db.delete(weatherRecords).where(eq(weatherRecords.entryId, entryId));

	const now = new Date();

	await db.insert(weatherRecords).values({
		id: generateId(),
		entryId,
		temperature: input.temperature,
		condition: input.condition,
		humidity: input.humidity,
		windSpeed: input.windSpeed,
		createdAt: now,
	});
}

export async function getWeather(db: Db, entryId: string): Promise<Weather | null> {
	const [row] = await db
		.select()
		.from(weatherRecords)
		.where(eq(weatherRecords.entryId, entryId))
		.limit(1);

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
}
