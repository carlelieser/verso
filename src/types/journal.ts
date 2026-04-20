import type { Timestamp } from './common';

export interface Journal {
	readonly id: string;
	readonly name: string;
	readonly icon: string;
	readonly color: string;
	readonly displayOrder: number;
	readonly isLocked: boolean;
	readonly hasOverridePin: boolean;
	readonly biometricsEnabled: boolean;
	readonly createdAt: Timestamp;
	readonly updatedAt: Timestamp;
}
