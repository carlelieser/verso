import { asc, eq, ne, sql } from 'drizzle-orm';

import type { Db } from '@/db/client';
import { journals } from '@/db/schema';
import { JournalNotFoundError } from '@/errors/domain-errors';
import type { Journal } from '@/types/journal';
import { generateId } from '@/utils/id';

interface CreateJournalInput {
	readonly name: string;
	readonly icon: string;
	readonly color: string;
}

interface UpdateJournalInput {
	readonly id: string;
	readonly name?: string;
	readonly icon?: string;
	readonly color?: string;
}

export function toJournal(row: {
	id: string;
	name: string;
	icon: string;
	color: string;
	displayOrder: number;
	createdAt: Date;
	updatedAt: Date;
}): Journal {
	return {
		id: row.id,
		name: row.name,
		icon: row.icon,
		color: row.color,
		displayOrder: row.displayOrder,
		createdAt: row.createdAt.getTime(),
		updatedAt: row.updatedAt.getTime(),
	};
}

export async function listJournals(db: Db): Promise<Journal[]> {
	const rows = await db.select().from(journals).orderBy(asc(journals.displayOrder));
	return rows.map(toJournal);
}

export async function createJournal(db: Db, input: CreateJournalInput): Promise<Journal> {
	const now = new Date();
	const id = generateId();

	const [maxOrder] = await db
		.select({ max: sql<number>`COALESCE(MAX(${journals.displayOrder}), -1)` })
		.from(journals);

	const displayOrder = (maxOrder?.max ?? -1) + 1;

	await db.insert(journals).values({
		id,
		name: input.name,
		icon: input.icon,
		color: input.color,
		displayOrder,
		createdAt: now,
		updatedAt: now,
	});

	return {
		id,
		name: input.name,
		icon: input.icon,
		color: input.color,
		displayOrder,
		createdAt: now.getTime(),
		updatedAt: now.getTime(),
	};
}

export async function updateJournal(db: Db, input: UpdateJournalInput): Promise<void> {
	const updates: Record<string, unknown> = { updatedAt: new Date() };
	if (input.name !== undefined) updates.name = input.name;
	if (input.icon !== undefined) updates.icon = input.icon;
	if (input.color !== undefined) updates.color = input.color;

	await db.update(journals).set(updates).where(eq(journals.id, input.id));
}

export async function setDefaultJournal(db: Db, id: string): Promise<void> {
	await db.transaction(async (tx) => {
		await tx
			.update(journals)
			.set({ displayOrder: sql`${journals.displayOrder} + 1` })
			.where(ne(journals.id, id));

		await tx
			.update(journals)
			.set({ displayOrder: 0, updatedAt: new Date() })
			.where(eq(journals.id, id));
	});
}

export async function deleteJournal(db: Db, id: string): Promise<void> {
	const [existing] = await db
		.select({ id: journals.id })
		.from(journals)
		.where(eq(journals.id, id))
		.limit(1);
	if (!existing) throw new JournalNotFoundError(id);
	await db.delete(journals).where(eq(journals.id, id));
}
