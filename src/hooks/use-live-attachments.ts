import { eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMemo } from 'react';

import { attachments } from '@/db/schema';
import { useDatabaseContext } from '@/providers/database-provider';
import { toAttachment } from '@/services/attachment-service';
import type { Attachment } from '@/types/attachment';

export function useLiveAttachments(entryId: string): readonly Attachment[] {
	const { db } = useDatabaseContext();

	const { data: rows } = useLiveQuery(
		db.select().from(attachments).where(eq(attachments.entryId, entryId)),
		[entryId],
	);

	return useMemo(() => {
		const result: Attachment[] = [];
		for (const row of rows) {
			const mapped = toAttachment(row);
			if (mapped) result.push(mapped);
		}
		return result;
	}, [rows]);
}
