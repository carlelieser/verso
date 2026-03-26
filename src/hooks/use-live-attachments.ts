import { eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMemo } from 'react';

import { attachments } from '@/db/schema';
import { useDatabaseContext } from '@/providers/database-provider';
import type { Attachment } from '@/types/attachment';
import { isAttachmentType } from '@/types/attachment';

function parseRow(row: {
	id: string;
	entryId: string;
	type: string;
	data: string;
	displayOrder: number;
	createdAt: Date;
}): Attachment | null {
	if (!isAttachmentType(row.type)) return null;

	try {
		const data: unknown = JSON.parse(row.data);
		return {
			id: row.id,
			entryId: row.entryId,
			type: row.type,
			data,
			displayOrder: row.displayOrder,
			createdAt: row.createdAt.getTime(),
		} as Attachment;
	} catch {
		return null;
	}
}

export function useLiveAttachments(entryId: string): readonly Attachment[] {
	const { db } = useDatabaseContext();

	const { data: rows } = useLiveQuery(
		db.select().from(attachments).where(eq(attachments.entryId, entryId)),
		[entryId],
	);

	return useMemo(() => {
		const result: Attachment[] = [];
		for (const row of rows) {
			const mapped = parseRow(row);
			if (mapped) result.push(mapped);
		}
		return result;
	}, [rows]);
}
