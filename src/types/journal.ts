import type { Timestamp } from './common';

export interface Journal {
	readonly id: string;
	readonly name: string;
	readonly icon: string;
	readonly color: string;
	readonly displayOrder: number;
	readonly createdAt: Timestamp;
	readonly updatedAt: Timestamp;
}
