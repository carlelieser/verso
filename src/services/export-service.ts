import { desc, eq } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { emotionRecords, entries, locations } from '@/db/schema';
import { EntryNotFoundError, ExportError } from '@/errors/domain-errors';
import type { EmotionCategory, ExportFormat } from '@/types/common';
import type { Entry } from '@/types/entry';
import { formatDate } from '@/utils/date';
import { htmlToMarkdown } from '@/utils/html-to-markdown';

interface EntryExportData {
  readonly entry: Entry;
  readonly emotions: readonly { readonly category: EmotionCategory; readonly intensity: number }[];
  readonly locationName: string | undefined;
}

interface ExportResult {
  readonly uri: string;
  readonly format: ExportFormat;
}

interface ExportService {
  readonly exportEntry: (entryId: string, format: ExportFormat) => Promise<ExportResult>;
  readonly exportJournal: (journalId: string, format: ExportFormat) => Promise<ExportResult>;
  readonly shareFile: (uri: string) => Promise<void>;
}

/**
 * Creates an ExportService for exporting journal entries as PDF, Markdown, or JSON.
 *
 * @param db - The Expo SQLite database instance
 * @returns An ExportService for generating and sharing exports
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createExportService(db: ExpoSQLiteDatabase<any>): ExportService {
  async function loadEntryData(entryId: string): Promise<EntryExportData> {
    const entryRows = await db
      .select()
      .from(entries)
      .where(eq(entries.id, entryId))
      .limit(1);

    const entryRow = entryRows[0];
    if (entryRow === undefined) {
      throw new EntryNotFoundError(entryId);
    }

    const entry: Entry = {
      id: entryRow.id,
      journalId: entryRow.journalId,
      contentHtml: entryRow.contentHtml,
      contentText: entryRow.contentText,
      createdAt: entryRow.createdAt.getTime(),
      updatedAt: entryRow.updatedAt.getTime(),
    };

    const emotionRows = await db
      .select({ category: emotionRecords.category, intensity: emotionRecords.intensity })
      .from(emotionRecords)
      .where(eq(emotionRecords.entryId, entryId));

    const emotions = emotionRows.map((row) => ({
      category: row.category as EmotionCategory,
      intensity: row.intensity,
    }));

    const locationRows = await db
      .select({ name: locations.name })
      .from(locations)
      .where(eq(locations.entryId, entryId))
      .limit(1);

    const locationName = locationRows[0]?.name;

    return { entry, emotions, locationName };
  }

  function buildHtmlDocument(data: EntryExportData): string {
    const dateStr = formatDate(data.entry.createdAt);
    const emotionTags = data.emotions
      .map((e) => `<span class="emotion">${e.category} (${e.intensity}/5)</span>`)
      .join(' ');
    const locationLine =
      data.locationName !== undefined ? `<p class="location">${data.locationName}</p>` : '';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 40px; max-width: 700px; margin: 0 auto; color: #1a1a1a; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    .meta { color: #666; font-size: 14px; margin-bottom: 24px; }
    .emotion { display: inline-block; background: #f0f0f0; border-radius: 12px; padding: 2px 10px; font-size: 13px; margin-right: 6px; }
    .location { font-size: 13px; color: #888; margin-top: 4px; }
    .content { line-height: 1.7; font-size: 16px; }
    .content img { max-width: 100%; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>${dateStr}</h1>
  <div class="meta">
    ${emotionTags}
    ${locationLine}
  </div>
  <div class="content">${data.entry.contentHtml}</div>
</body>
</html>`;
  }

  function buildMarkdown(data: EntryExportData): string {
    const dateStr = formatDate(data.entry.createdAt);
    const emotionNames = data.emotions.map((e) => e.category);

    return htmlToMarkdown(data.entry.contentHtml, {
      date: dateStr,
      emotions: emotionNames,
      location: data.locationName,
    });
  }

  function buildJson(dataList: readonly EntryExportData[]): string {
    const payload = dataList.map((data) => ({
      id: data.entry.id,
      date: formatDate(data.entry.createdAt),
      createdAt: data.entry.createdAt,
      updatedAt: data.entry.updatedAt,
      contentText: data.entry.contentText,
      contentHtml: data.entry.contentHtml,
      emotions: data.emotions.map((e) => ({
        category: e.category,
        intensity: e.intensity,
      })),
      location: data.locationName ?? null,
    }));

    return JSON.stringify(payload, null, 2);
  }

  async function generatePdf(html: string): Promise<string> {
    try {
      const { uri } = await Print.printToFileAsync({ html });
      return uri;
    } catch (error: unknown) {
      throw new ExportError('Failed to generate PDF', { cause: error });
    }
  }

  return {
    async exportEntry(entryId, format): Promise<ExportResult> {
      const data = await loadEntryData(entryId);

      switch (format) {
        case 'pdf': {
          const html = buildHtmlDocument(data);
          const uri = await generatePdf(html);
          return { uri, format };
        }

        case 'markdown': {
          const markdown = buildMarkdown(data);
          const { uri } = await Print.printToFileAsync({
            html: `<pre>${markdown}</pre>`,
          });
          return { uri, format };
        }

        case 'json': {
          const json = buildJson([data]);
          const { uri } = await Print.printToFileAsync({
            html: `<pre>${json}</pre>`,
          });
          return { uri, format };
        }
      }
    },

    async exportJournal(journalId, format): Promise<ExportResult> {
      const entryRows = await db
        .select()
        .from(entries)
        .where(eq(entries.journalId, journalId))
        .orderBy(desc(entries.createdAt));

      if (entryRows.length === 0) {
        throw new ExportError('No entries found in this journal');
      }

      const allData: EntryExportData[] = [];
      for (const row of entryRows) {
        const data = await loadEntryData(row.id);
        allData.push(data);
      }

      switch (format) {
        case 'pdf': {
          const htmlSections = allData.map(buildHtmlDocument);
          const combined = htmlSections.join('<hr style="margin: 48px 0;" />');
          const uri = await generatePdf(combined);
          return { uri, format };
        }

        case 'markdown': {
          const markdownSections = allData.map(buildMarkdown);
          const combined = markdownSections.join('\n\n---\n\n');
          const { uri } = await Print.printToFileAsync({
            html: `<pre>${combined}</pre>`,
          });
          return { uri, format };
        }

        case 'json': {
          const json = buildJson(allData);
          const { uri } = await Print.printToFileAsync({
            html: `<pre>${json}</pre>`,
          });
          return { uri, format };
        }
      }
    },

    async shareFile(uri): Promise<void> {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        throw new ExportError('Sharing is not available on this device');
      }

      await Sharing.shareAsync(uri);
    },
  };
}
