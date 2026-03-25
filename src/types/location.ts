import type { Timestamp } from './common';

export interface Location {
	readonly id: string;
	readonly entryId: string;
	readonly name: string;
	readonly latitude: number | null;
	readonly longitude: number | null;
	readonly createdAt: Timestamp;
}

export interface LocationInput {
	readonly name: string;
	readonly latitude: number | null;
	readonly longitude: number | null;
}
