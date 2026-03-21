import { eq, sql } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { Paths, File } from 'expo-file-system';

import { attachments } from '@/db/schema';
import type { Attachment } from '@/types/attachment';
import { generateId } from '@/utils/id';

export function createAttachmentService(db: ExpoSQLiteDatabase): {
  addPhoto: (entryId: string, uri: string) => Promise<Attachment>;
  addVoiceMemo: (entryId: string, uri: string) => Promise<Attachment>;
  addFile: (entryId: string, uri: string, fileName: string) => Promise<Attachment>;
  addLink: (entryId: string, url: string) => Promise<Attachment>;
  getByEntry: (entryId: string) => Promise<readonly Attachment[]>;
  delete: (id: string) => Promise<void>;
} {
  async function addAttachment(
    entryId: string,
    type: string,
    uri: string,
    fileName: string | null,
    mimeType: string | null,
  ): Promise<Attachment> {
    const id = generateId();
    const now = Date.now();

    let sizeBytes: number | null = null;
    if (type !== 'link') {
      try {
        const file = new File(uri);
        if (file.exists) {
          sizeBytes = file.size ?? null;
        }
      } catch {
        // File size is optional
      }
    }

    const maxOrderResult = await db
      .select({ maxOrder: sql<number>`COALESCE(MAX(${attachments.displayOrder}), -1)` })
      .from(attachments)
      .where(eq(attachments.entryId, entryId));

    const displayOrder = (maxOrderResult[0]?.maxOrder ?? -1) + 1;

    const attachment: Attachment = {
      id,
      entryId,
      type: type as Attachment['type'],
      uri,
      mimeType,
      fileName,
      sizeBytes,
      displayOrder,
      createdAt: now,
    };

    await db.insert(attachments).values({
      id,
      entryId,
      type,
      uri,
      mimeType,
      fileName,
      sizeBytes,
      displayOrder,
      createdAt: new Date(now),
    });

    return attachment;
  }

  return {
    async addPhoto(entryId, uri): Promise<Attachment> {
      return addAttachment(entryId, 'photo', uri, null, 'image/jpeg');
    },

    async addVoiceMemo(entryId, uri): Promise<Attachment> {
      return addAttachment(entryId, 'voice_memo', uri, null, 'audio/m4a');
    },

    async addFile(entryId, uri, fileName): Promise<Attachment> {
      return addAttachment(entryId, 'file', uri, fileName, null);
    },

    async addLink(entryId, url): Promise<Attachment> {
      return addAttachment(entryId, 'link', url, null, null);
    },

    async getByEntry(entryId): Promise<readonly Attachment[]> {
      const rows = await db
        .select()
        .from(attachments)
        .where(eq(attachments.entryId, entryId))
        .orderBy(attachments.displayOrder);

      return rows.map(toAttachment);
    },

    async delete(id): Promise<void> {
      await db.delete(attachments).where(eq(attachments.id, id));
    },
  };
}

function toAttachment(row: typeof attachments.$inferSelect): Attachment {
  return {
    id: row.id,
    entryId: row.entryId,
    type: row.type as Attachment['type'],
    uri: row.uri,
    mimeType: row.mimeType,
    fileName: row.fileName,
    sizeBytes: row.sizeBytes,
    displayOrder: row.displayOrder,
    createdAt: row.createdAt.getTime(),
  };
}
