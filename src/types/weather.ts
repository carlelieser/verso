import type { Timestamp } from './common';

export interface Weather {
	readonly id: string;
	readonly entryId: string;
	readonly temperature: number;
	readonly condition: string;
	readonly humidity: number;
	readonly windSpeed: number;
	readonly createdAt: Timestamp;
}

export interface WeatherInput {
	readonly temperature: number;
	readonly condition: string;
	readonly humidity: number;
	readonly windSpeed: number;
}
