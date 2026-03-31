import { asc, eq, max } from 'drizzle-orm';
import { Directory, File, Paths } from 'expo-file-system';

import type { Db } from '@/db/client';
import { attachments } from '@/db/schema';
import type { Attachment, AttachmentType, FileData, LocationData } from '@/types/attachment';
import { isAttachmentType } from '@/types/attachment';
import { generateId } from '@/utils/id';

interface AddFileAttachmentInput {
	readonly entryId: string;
	readonly type: 'image' | 'audio' | 'document' | 'voice-note';
	readonly sourceUri: string;
	readonly mimeType: string | null;
	readonly fileName: string | null;
	readonly sizeBytes: number | null;
}

interface AddLocationAttachmentInput {
	readonly entryId: string;
	readonly name: string;
	readonly latitude: number | null;
	readonly longitude: number | null;
}

function getExtension(fileName: string | null, mimeType: string | null): string {
	if (fileName) {
		const dotIndex = fileName.lastIndexOf('.');
		if (dotIndex >= 0) return fileName.slice(dotIndex);
	}
	if (mimeType) {
		const sub = mimeType.split('/')[1];
		if (sub) return `.${sub.split('+')[0]}`;
	}
	return '';
}

function getAttachmentDir(entryId: string): Directory {
	return new Directory(Paths.document, 'attachments', entryId);
}

function parseData(type: AttachmentType, raw: string): FileData | LocationData | null {
	try {
		return JSON.parse(raw) as FileData | LocationData;
	} catch {
		return null;
	}
}

export function toAttachment(row: {
	id: string;
	entryId: string;
	type: string;
	data: string;
	displayOrder: number;
	createdAt: Date;
}): Attachment | null {
	if (!isAttachmentType(row.type)) return null;

	const data = parseData(row.type, row.data);
	if (!data) return null;

	return {
		id: row.id,
		entryId: row.entryId,
		type: row.type,
		data,
		displayOrder: row.displayOrder,
		createdAt: row.createdAt.getTime(),
	} as Attachment;
}

async function getNextOrder(db: Db, entryId: string): Promise<number> {
	const [maxRow] = await db
		.select({ maxOrder: max(attachments.displayOrder) })
		.from(attachments)
		.where(eq(attachments.entryId, entryId));
	return (maxRow?.maxOrder ?? -1) + 1;
}

export async function addFileAttachment(
	db: Db,
	input: AddFileAttachmentInput,
): Promise<Attachment> {
	const id = generateId();
	const ext = getExtension(input.fileName, input.mimeType);
	const dir = getAttachmentDir(input.entryId);
	const destFileName = `${id}${ext}`;

	dir.create({ intermediates: true, idempotent: true });

	const sourceFile = new File(input.sourceUri);
	const destFile = new File(dir, destFileName);

	try {
		sourceFile.copy(destFile);
	} catch (copyError: unknown) {
		throw new Error('Failed to copy attachment file', { cause: copyError });
	}

	const now = new Date();
	const nextOrder = await getNextOrder(db, input.entryId);
	const data: FileData = {
		uri: destFile.uri,
		mimeType: input.mimeType,
		fileName: input.fileName,
		sizeBytes: input.sizeBytes,
	};

	try {
		await db.insert(attachments).values({
			id,
			entryId: input.entryId,
			type: input.type,
			data: JSON.stringify(data),
			displayOrder: nextOrder,
			createdAt: now,
		});
	} catch (dbError: unknown) {
		try {
			destFile.delete();
		} catch {
			// Best-effort cleanup
		}
		throw new Error('Failed to save attachment record', { cause: dbError });
	}

	return {
		id,
		entryId: input.entryId,
		type: input.type,
		data,
		displayOrder: nextOrder,
		createdAt: now.getTime(),
	};
}

export async function addLocationAttachment(
	db: Db,
	input: AddLocationAttachmentInput,
): Promise<Attachment> {
	const id = generateId();
	const now = new Date();
	const nextOrder = await getNextOrder(db, input.entryId);
	const data: LocationData = {
		name: input.name,
		latitude: input.latitude,
		longitude: input.longitude,
	};

	await db.insert(attachments).values({
		id,
		entryId: input.entryId,
		type: 'location',
		data: JSON.stringify(data),
		displayOrder: nextOrder,
		createdAt: now,
	});

	return {
		id,
		entryId: input.entryId,
		type: 'location',
		data,
		displayOrder: nextOrder,
		createdAt: now.getTime(),
	};
}

export async function deleteAttachment(db: Db, id: string): Promise<void> {
	const [row] = await db
		.select({ type: attachments.type, data: attachments.data })
		.from(attachments)
		.where(eq(attachments.id, id))
		.limit(1);

	if (row && row.type !== 'location') {
		try {
			const parsed = JSON.parse(row.data) as FileData;
			if (parsed.uri) {
				const file = new File(parsed.uri);
				if (file.exists) file.delete();
			}
		} catch {
			// Best-effort cleanup
		}
	}

	await db.delete(attachments).where(eq(attachments.id, id));
}

export async function listAttachments(db: Db, entryId: string): Promise<readonly Attachment[]> {
	const rows = await db
		.select()
		.from(attachments)
		.where(eq(attachments.entryId, entryId))
		.orderBy(asc(attachments.displayOrder), asc(attachments.createdAt));

	const result: Attachment[] = [];
	for (const row of rows) {
		const mapped = toAttachment(row);
		if (mapped) result.push(mapped);
	}
	return result;
}

export function deleteAttachmentFiles(entryId: string): void {
	const dir = getAttachmentDir(entryId);
	if (dir.exists) {
		dir.delete();
	}
}
