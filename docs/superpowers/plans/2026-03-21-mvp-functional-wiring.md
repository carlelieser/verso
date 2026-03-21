# MVP Functional Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the existing Verso journal UI to a local SQLite database so the app is fully functional — create journals, write entries with auto-save, track emotions, browse history, search, and view/edit past entries.

**Architecture:** Services are plain functions taking `db` as first arg. Hooks wrap services with React state. Screens consume hooks. Auto-save uses a debounced hook. FTS5 search uses raw SQL via `db.$client`.

**Tech Stack:** React Native 0.84+, Expo SDK 54+, Drizzle ORM, expo-sqlite (SQLCipher), react-native-enriched, HeroUI Native, Uniwind/Tailwind v4, lucide-react-native

**Spec:** `docs/superpowers/specs/2026-03-21-mvp-functional-wiring-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/services/journal-service.ts` | Journal CRUD, entry counts |
| `src/services/entry-service.ts` | Entry CRUD, FTS5 search |
| `src/services/emotion-service.ts` | Emotion record CRUD |
| `src/hooks/use-journals.ts` | React wrapper for journal-service |
| `src/hooks/use-entries.ts` | React wrapper for entry-service |
| `src/hooks/use-emotions.ts` | React wrapper for emotion-service |
| `src/hooks/use-auto-save.ts` | Debounced auto-save for entry content |
| `src/constants/journal-icons.ts` | Shared icon key → Lucide component map |
| `src/app/entry/[id]/index.tsx` | Read-only entry view |
| `src/app/entry/[id]/edit.tsx` | Edit existing entry |
| `drizzle/0001_add_journal_icon.sql` | Migration: add icon column |

### Modified Files
| File | Change |
|------|--------|
| `src/db/schema.ts` | Add `icon` column to journals table |
| `src/db/client.ts` | Add `PRAGMA recursive_triggers = ON` |
| `drizzle/migrations.js` | Register new migration |
| `drizzle/meta/_journal.json` | Add migration entry |
| `src/types/journal.ts` | Add `icon` field to Journal interface |
| `src/components/emotion-checkin.tsx` | Add Done button, call `onSave` |
| `src/components/journal-select.tsx` | Render dynamic icons per journal |
| `src/app/index.tsx` | Replace mock data, wire DB, auto-save lifecycle |
| `src/app/journals.tsx` | Replace mock data, wire DB, add search, dynamic icons |
| `src/app/history.tsx` | Replace mock data, wire DB, add search, tap-to-view |

---

## Task 1: Schema — Add journal icon column + recursive triggers

**Files:**
- Modify: `src/db/schema.ts:13-30`
- Modify: `src/db/client.ts:40`
- Modify: `src/types/journal.ts:3-10`
- Create: `drizzle/0001_add_journal_icon.sql`
- Modify: `drizzle/migrations.js`
- Modify: `drizzle/meta/_journal.json`

- [ ] **Step 1: Add icon to schema.ts**

In `src/db/schema.ts`, add the `icon` column to the `journals` table definition, after the `name` column:

```ts
icon: text('icon').notNull().default('book-open'),
```

- [ ] **Step 2: Add icon to Journal type**

In `src/types/journal.ts`, add to the `Journal` interface:

```ts
readonly icon: string;
```

- [ ] **Step 3: Add recursive_triggers pragma**

In `src/db/client.ts`, add after the `foreign_keys` pragma (line 40):

```ts
sqliteDb.execSync('PRAGMA recursive_triggers = ON');
```

- [ ] **Step 4: Create migration SQL**

Create `drizzle/0001_add_journal_icon.sql`:

```sql
ALTER TABLE `journal` ADD `icon` text DEFAULT 'book-open' NOT NULL;
```

- [ ] **Step 5: Register migration**

Update `drizzle/migrations.js`:

```js
import journal from './meta/_journal.json';
import m0000 from './0000_lyrical_lightspeed.sql';
import m0001 from './0001_add_journal_icon.sql';

export default {
  journal,
  migrations: {
    m0000,
    m0001
  }
}
```

Update `drizzle/meta/_journal.json` — add entry to the `entries` array:

```json
{
  "idx": 1,
  "version": "6",
  "when": 1774329600000,
  "tag": "0001_add_journal_icon",
  "breakpoints": true
}
```

- [ ] **Step 6: Commit**

```bash
git add src/db/schema.ts src/db/client.ts src/types/journal.ts drizzle/
git commit -m "feat: add journal icon column and recursive triggers pragma"
```

---

## Task 2: Shared journal icon mapping

**Files:**
- Create: `src/constants/journal-icons.ts`

- [ ] **Step 1: Create the icon mapping**

Create `src/constants/journal-icons.ts`. Extract the icon data from `src/components/create-journal.tsx` (the `ICONS` array) into a shared map:

```ts
import type { ComponentType } from 'react';

import {
  BookOpen,
  Briefcase,
  Coffee,
  Flame,
  Heart,
  Leaf,
  Lightbulb,
  Moon,
  Plane,
  Sparkles,
  Star,
  Sun,
} from 'lucide-react-native';

interface IconDefinition {
  readonly key: string;
  readonly Icon: ComponentType<{ size?: number; color?: string }>;
}

export const JOURNAL_ICONS: readonly IconDefinition[] = [
  { key: 'book-open', Icon: BookOpen },
  { key: 'heart', Icon: Heart },
  { key: 'star', Icon: Star },
  { key: 'lightbulb', Icon: Lightbulb },
  { key: 'flame', Icon: Flame },
  { key: 'leaf', Icon: Leaf },
  { key: 'moon', Icon: Moon },
  { key: 'sun', Icon: Sun },
  { key: 'coffee', Icon: Coffee },
  { key: 'plane', Icon: Plane },
  { key: 'briefcase', Icon: Briefcase },
  { key: 'sparkles', Icon: Sparkles },
] as const;

export const JOURNAL_ICON_MAP: Record<string, ComponentType<{ size?: number; color?: string }>> =
  Object.fromEntries(JOURNAL_ICONS.map(({ key, Icon }) => [key, Icon]));

/**
 * Resolves an icon key to its Lucide component. Falls back to BookOpen.
 */
export function getJournalIcon(key: string): ComponentType<{ size?: number; color?: string }> {
  return JOURNAL_ICON_MAP[key] ?? BookOpen;
}
```

- [ ] **Step 2: Update create-journal.tsx to use shared mapping**

In `src/components/create-journal.tsx`, replace the local `ICONS` array and icon imports with the shared constant:

Replace the icon imports (lines 1-14) and `ICONS` array (lines 21-34) with:

```ts
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Button } from 'heroui-native';

import { JOURNAL_ICONS } from '@/constants/journal-icons';
```

Replace references to the local `ICONS` in the render (line 61 `{ICONS.map(({key, Icon}) => {`) — this stays the same since `JOURNAL_ICONS` has the same shape. Just replace `ICONS` with `JOURNAL_ICONS`.

- [ ] **Step 3: Commit**

```bash
git add src/constants/journal-icons.ts src/components/create-journal.tsx
git commit -m "feat: extract shared journal icon mapping"
```

---

## Task 3: Journal service

**Files:**
- Create: `src/services/journal-service.ts`

- [ ] **Step 1: Implement journal-service.ts**

```ts
import { asc, count, eq, sql } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

import { entries, journals } from '@/db/schema';
import type { Journal } from '@/types/journal';
import { generateId } from '@/utils/id';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = ExpoSQLiteDatabase<any>;

interface CreateJournalInput {
  readonly userId: string;
  readonly name: string;
  readonly icon: string;
}

interface UpdateJournalInput {
  readonly id: string;
  readonly name?: string;
  readonly icon?: string;
}

export async function listJournals(db: Db, userId: string): Promise<Journal[]> {
  const rows = await db
    .select()
    .from(journals)
    .where(eq(journals.userId, userId))
    .orderBy(asc(journals.displayOrder));

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    name: row.name,
    icon: row.icon,
    displayOrder: row.displayOrder,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  }));
}

export async function createJournal(db: Db, input: CreateJournalInput): Promise<Journal> {
  const now = new Date();
  const id = generateId();

  const [maxOrder] = await db
    .select({ max: sql<number>`COALESCE(MAX(${journals.displayOrder}), -1)` })
    .from(journals)
    .where(eq(journals.userId, input.userId));

  const displayOrder = (maxOrder?.max ?? -1) + 1;

  await db.insert(journals).values({
    id,
    userId: input.userId,
    name: input.name,
    icon: input.icon,
    displayOrder,
    createdAt: now,
    updatedAt: now,
  });

  return {
    id,
    userId: input.userId,
    name: input.name,
    icon: input.icon,
    displayOrder,
    createdAt: now.getTime(),
    updatedAt: now.getTime(),
  };
}

export async function updateJournal(db: Db, input: UpdateJournalInput): Promise<void> {
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) updates.name = input.name;
  if (input.icon !== undefined) updates.icon = input.icon;

  await db.update(journals).set(updates).where(eq(journals.id, input.id));
}

export async function deleteJournal(db: Db, id: string): Promise<void> {
  await db.delete(journals).where(eq(journals.id, id));
}

export async function getJournalEntryCounts(
  db: Db,
  userId: string,
): Promise<Map<string, number>> {
  const rows = await db
    .select({
      journalId: entries.journalId,
      count: count(),
    })
    .from(entries)
    .innerJoin(journals, eq(entries.journalId, journals.id))
    .where(eq(journals.userId, userId))
    .groupBy(entries.journalId);

  return new Map(rows.map((row) => [row.journalId, row.count]));
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/journal-service.ts
git commit -m "feat: implement journal service"
```

---

## Task 4: Entry service

**Files:**
- Create: `src/services/entry-service.ts`

- [ ] **Step 1: Implement entry-service.ts**

```ts
import { desc, eq, sql } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

import { emotionRecords, entries, journals } from '@/db/schema';
import type { EmotionCategory, EmotionIntensity } from '@/types/common';
import type { EmotionRecord } from '@/types/emotion';
import type { Entry } from '@/types/entry';
import { generateId } from '@/utils/id';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = ExpoSQLiteDatabase<any>;

interface CreateEntryInput {
  readonly journalId: string;
  readonly contentHtml: string;
  readonly contentText: string;
}

interface UpdateEntryInput {
  readonly id: string;
  readonly contentHtml: string;
  readonly contentText: string;
}

interface ListEntriesInput {
  readonly userId: string;
  readonly journalId?: string;
  readonly limit?: number;
  readonly offset?: number;
}

export interface EntryWithJournal extends Entry {
  readonly journalName: string;
}

export interface EntryWithEmotions extends Entry {
  readonly emotions: readonly EmotionRecord[];
}

function toEntry(row: {
  id: string;
  journalId: string;
  contentHtml: string;
  contentText: string;
  createdAt: Date;
  updatedAt: Date;
}): Entry {
  return {
    id: row.id,
    journalId: row.journalId,
    contentHtml: row.contentHtml,
    contentText: row.contentText,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  };
}

export async function createEntry(db: Db, input: CreateEntryInput): Promise<Entry> {
  const now = new Date();
  const id = generateId();

  await db.insert(entries).values({
    id,
    journalId: input.journalId,
    contentHtml: input.contentHtml,
    contentText: input.contentText,
    createdAt: now,
    updatedAt: now,
  });

  return {
    id,
    journalId: input.journalId,
    contentHtml: input.contentHtml,
    contentText: input.contentText,
    createdAt: now.getTime(),
    updatedAt: now.getTime(),
  };
}

export async function updateEntry(db: Db, input: UpdateEntryInput): Promise<void> {
  await db
    .update(entries)
    .set({
      contentHtml: input.contentHtml,
      contentText: input.contentText,
      updatedAt: new Date(),
    })
    .where(eq(entries.id, input.id));
}

export async function deleteEntry(db: Db, id: string): Promise<void> {
  await db.delete(entries).where(eq(entries.id, id));
}

export async function getEntry(db: Db, id: string): Promise<EntryWithEmotions | null> {
  const [row] = await db.select().from(entries).where(eq(entries.id, id)).limit(1);

  if (!row) return null;

  const emotions = await db
    .select()
    .from(emotionRecords)
    .where(eq(emotionRecords.entryId, id));

  return {
    ...toEntry(row),
    emotions: emotions.map((e) => ({
      id: e.id,
      entryId: e.entryId,
      category: e.category as EmotionCategory,
      intensity: e.intensity as EmotionIntensity,
      createdAt: e.createdAt.getTime(),
    })),
  };
}

export async function listEntries(db: Db, input: ListEntriesInput): Promise<EntryWithJournal[]> {
  const limit = input.limit ?? 50;
  const offset = input.offset ?? 0;

  const baseFilter = input.journalId
    ? eq(entries.journalId, input.journalId)
    : eq(journals.userId, input.userId);

  const rows = await db
    .select({
      id: entries.id,
      journalId: entries.journalId,
      contentHtml: entries.contentHtml,
      contentText: entries.contentText,
      createdAt: entries.createdAt,
      updatedAt: entries.updatedAt,
      journalName: journals.name,
    })
    .from(entries)
    .innerJoin(journals, eq(entries.journalId, journals.id))
    .where(baseFilter)
    .orderBy(desc(entries.createdAt))
    .limit(limit)
    .offset(offset);

  return rows.map((row) => ({
    ...toEntry(row as unknown as { id: string; journalId: string; contentHtml: string; contentText: string; createdAt: Date; updatedAt: Date }),
    journalName: row.journalName,
  }));
}

export async function searchEntries(db: Db, query: string): Promise<EntryWithJournal[]> {
  const rawDb = (db as unknown as { $client: { getAllSync: (sql: string, params: unknown[]) => unknown[] } }).$client;

  const rows = rawDb.getAllSync(
    `SELECT e.id, e.journal_id, e.content_html, e.content_text, e.created_at, e.updated_at, j.name as journal_name
     FROM entry_fts fts
     JOIN entry e ON e.rowid = fts.rowid
     JOIN journal j ON j.id = e.journal_id
     WHERE entry_fts MATCH ?
     ORDER BY rank`,
    [query],
  ) as Array<{
    id: string;
    journal_id: string;
    content_html: string;
    content_text: string;
    created_at: number;
    updated_at: number;
    journal_name: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    journalId: row.journal_id,
    contentHtml: row.content_html,
    contentText: row.content_text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    journalName: row.journal_name,
  }));
}
```

Note: The `searchEntries` function uses raw SQL because Drizzle has no built-in FTS5 support. The raw query returns snake_case columns which are mapped to camelCase in the return.

- [ ] **Step 2: Commit**

```bash
git add src/services/entry-service.ts
git commit -m "feat: implement entry service with FTS5 search"
```

---

## Task 5: Emotion service

**Files:**
- Create: `src/services/emotion-service.ts`

- [ ] **Step 1: Implement emotion-service.ts**

```ts
import { eq } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

import { emotionRecords } from '@/db/schema';
import type { EmotionCategory, EmotionIntensity } from '@/types/common';
import type { EmotionInput, EmotionRecord } from '@/types/emotion';
import { generateId } from '@/utils/id';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = ExpoSQLiteDatabase<any>;

export async function saveEmotions(
  db: Db,
  entryId: string,
  emotions: readonly EmotionInput[],
): Promise<void> {
  await db.delete(emotionRecords).where(eq(emotionRecords.entryId, entryId));

  if (emotions.length === 0) return;

  const now = new Date();

  await db.insert(emotionRecords).values(
    emotions.map((e) => ({
      id: generateId(),
      entryId,
      category: e.category,
      intensity: e.intensity,
      createdAt: now,
    })),
  );
}

export async function getEmotions(db: Db, entryId: string): Promise<EmotionRecord[]> {
  const rows = await db
    .select()
    .from(emotionRecords)
    .where(eq(emotionRecords.entryId, entryId));

  return rows.map((row) => ({
    id: row.id,
    entryId: row.entryId,
    category: row.category as EmotionCategory,
    intensity: row.intensity as EmotionIntensity,
    createdAt: row.createdAt.getTime(),
  }));
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/emotion-service.ts
git commit -m "feat: implement emotion service"
```

---

## Task 6: use-journals hook

**Files:**
- Create: `src/hooks/use-journals.ts`

- [ ] **Step 1: Implement use-journals.ts**

```ts
import { useCallback, useEffect, useState } from 'react';

import { GUEST_USER_ID } from '@/constants/user';
import { useDatabaseContext } from '@/providers/database-provider';
import {
  createJournal as createJournalService,
  deleteJournal as deleteJournalService,
  getJournalEntryCounts,
  listJournals,
  updateJournal as updateJournalService,
} from '@/services/journal-service';
import type { Journal } from '@/types/journal';

interface UseJournalsResult {
  readonly journals: readonly Journal[];
  readonly entryCounts: ReadonlyMap<string, number>;
  readonly isLoading: boolean;
  readonly refresh: () => Promise<void>;
  readonly createJournal: (name: string, icon: string) => Promise<Journal>;
  readonly updateJournal: (id: string, updates: { name?: string; icon?: string }) => Promise<void>;
  readonly deleteJournal: (id: string) => Promise<void>;
}

export function useJournals(): UseJournalsResult {
  const { db } = useDatabaseContext();
  const [journals, setJournals] = useState<readonly Journal[]>([]);
  const [entryCounts, setEntryCounts] = useState<ReadonlyMap<string, number>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [journalList, counts] = await Promise.all([
      listJournals(db, GUEST_USER_ID),
      getJournalEntryCounts(db, GUEST_USER_ID),
    ]);
    setJournals(journalList);
    setEntryCounts(counts);
    setIsLoading(false);
  }, [db]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createJournal = useCallback(
    async (name: string, icon: string): Promise<Journal> => {
      const journal = await createJournalService(db, {
        userId: GUEST_USER_ID,
        name,
        icon,
      });
      await refresh();
      return journal;
    },
    [db, refresh],
  );

  const updateJournal = useCallback(
    async (id: string, updates: { name?: string; icon?: string }): Promise<void> => {
      await updateJournalService(db, { id, ...updates });
      await refresh();
    },
    [db, refresh],
  );

  const deleteJournal = useCallback(
    async (id: string): Promise<void> => {
      await deleteJournalService(db, id);
      await refresh();
    },
    [db, refresh],
  );

  return { journals, entryCounts, isLoading, refresh, createJournal, updateJournal, deleteJournal };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-journals.ts
git commit -m "feat: implement use-journals hook"
```

---

## Task 7: use-entries hook

**Files:**
- Create: `src/hooks/use-entries.ts`

- [ ] **Step 1: Implement use-entries.ts**

```ts
import { useCallback, useEffect, useState } from 'react';

import { GUEST_USER_ID } from '@/constants/user';
import { useDatabaseContext } from '@/providers/database-provider';
import {
  createEntry as createEntryService,
  deleteEntry as deleteEntryService,
  type EntryWithEmotions,
  type EntryWithJournal,
  getEntry,
  listEntries as listEntriesService,
  searchEntries as searchEntriesService,
  updateEntry as updateEntryService,
} from '@/services/entry-service';
import type { Entry } from '@/types/entry';

interface UseEntriesResult {
  readonly entries: readonly EntryWithJournal[];
  readonly isLoading: boolean;
  readonly refresh: (journalId?: string) => Promise<void>;
  readonly createEntry: (journalId: string, html: string, text: string) => Promise<Entry>;
  readonly updateEntry: (id: string, html: string, text: string) => Promise<void>;
  readonly deleteEntry: (id: string) => Promise<void>;
  readonly loadEntry: (id: string) => Promise<EntryWithEmotions | null>;
  readonly searchEntries: (query: string) => Promise<void>;
}

export function useEntries(journalId?: string): UseEntriesResult {
  const { db } = useDatabaseContext();
  const [entries, setEntries] = useState<readonly EntryWithJournal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(
    async (filterJournalId?: string) => {
      const list = await listEntriesService(db, {
        userId: GUEST_USER_ID,
        journalId: filterJournalId ?? journalId,
      });
      setEntries(list);
      setIsLoading(false);
    },
    [db, journalId],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createEntry = useCallback(
    async (entryJournalId: string, html: string, text: string): Promise<Entry> => {
      const entry = await createEntryService(db, {
        journalId: entryJournalId,
        contentHtml: html,
        contentText: text,
      });
      return entry;
    },
    [db],
  );

  const updateEntry = useCallback(
    async (id: string, html: string, text: string): Promise<void> => {
      await updateEntryService(db, { id, contentHtml: html, contentText: text });
    },
    [db],
  );

  const deleteEntry = useCallback(
    async (id: string): Promise<void> => {
      await deleteEntryService(db, id);
      await refresh();
    },
    [db, refresh],
  );

  const loadEntry = useCallback(
    async (id: string): Promise<EntryWithEmotions | null> => {
      return getEntry(db, id);
    },
    [db],
  );

  const searchEntries = useCallback(
    async (query: string): Promise<void> => {
      if (query.trim().length === 0) {
        await refresh();
        return;
      }
      const results = await searchEntriesService(db, query);
      setEntries(results);
    },
    [db, refresh],
  );

  return {
    entries,
    isLoading,
    refresh,
    createEntry,
    updateEntry,
    deleteEntry,
    loadEntry,
    searchEntries,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-entries.ts
git commit -m "feat: implement use-entries hook"
```

---

## Task 8: use-emotions hook

**Files:**
- Create: `src/hooks/use-emotions.ts`

- [ ] **Step 1: Implement use-emotions.ts**

```ts
import { useCallback } from 'react';

import { useDatabaseContext } from '@/providers/database-provider';
import {
  getEmotions as getEmotionsService,
  saveEmotions as saveEmotionsService,
} from '@/services/emotion-service';
import type { EmotionInput, EmotionRecord } from '@/types/emotion';

interface UseEmotionsResult {
  readonly saveEmotions: (entryId: string, emotions: readonly EmotionInput[]) => Promise<void>;
  readonly getEmotions: (entryId: string) => Promise<EmotionRecord[]>;
}

export function useEmotions(): UseEmotionsResult {
  const { db } = useDatabaseContext();

  const saveEmotions = useCallback(
    async (entryId: string, emotions: readonly EmotionInput[]): Promise<void> => {
      await saveEmotionsService(db, entryId, emotions);
    },
    [db],
  );

  const getEmotions = useCallback(
    async (entryId: string): Promise<EmotionRecord[]> => {
      return getEmotionsService(db, entryId);
    },
    [db],
  );

  return { saveEmotions, getEmotions };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-emotions.ts
git commit -m "feat: implement use-emotions hook"
```

---

## Task 9: use-auto-save hook

**Files:**
- Create: `src/hooks/use-auto-save.ts`

- [ ] **Step 1: Implement use-auto-save.ts**

```ts
import { useEffect, useRef } from 'react';

import { useDatabaseContext } from '@/providers/database-provider';
import { updateEntry } from '@/services/entry-service';

const DEBOUNCE_MS = 500;

interface AutoSaveContent {
  readonly html: string;
  readonly text: string;
}

/**
 * Debounced auto-save for entry content.
 * No-ops when entryId is null (entry not yet created).
 * The caller should track html/text in refs and pass current values.
 */
export function useAutoSave(entryId: string | null, content: AutoSaveContent): void {
  const { db } = useDatabaseContext();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef(content);
  latestRef.current = content;

  useEffect(() => {
    if (!entryId) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      const { html, text } = latestRef.current;
      updateEntry(db, { id: entryId, contentHtml: html, contentText: text });
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [db, entryId, content.html, content.text]);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-auto-save.ts
git commit -m "feat: implement use-auto-save hook"
```

---

## Task 10: Update EmotionCheckin — add Done button

**Files:**
- Modify: `src/components/emotion-checkin.tsx:111-173`

- [ ] **Step 1: Add Done button to EmotionCheckin**

In `src/components/emotion-checkin.tsx`, add a `Button` import from `heroui-native` and add a Done button at the bottom of the component that calls `onSave` with the current selections.

Add to the imports at line 16:

```ts
import { Button, Slider } from 'heroui-native';
```

Then at the end of the component's return JSX, after the intensity section closing (before the final `</View>` at line 172), add the Done button:

```tsx
{selected.size > 0 ? (
  <Button
    variant="primary"
    size="lg"
    onPress={() => {
      const selections = [...selected.entries()].map(([emotion, intensity]) => ({
        emotion,
        intensity,
      }));
      onSave(selections);
    }}
  >
    <Button.Label>Done</Button.Label>
  </Button>
) : null}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/emotion-checkin.tsx
git commit -m "feat: add Done button to EmotionCheckin component"
```

---

## Task 11: Update JournalSelect — dynamic icons

**Files:**
- Modify: `src/components/journal-select.tsx`

- [ ] **Step 1: Add dynamic icon rendering**

In `src/components/journal-select.tsx`:

Add the icon import at the top (after existing imports):

```ts
import { getJournalIcon } from '@/constants/journal-icons';
```

In the menu items section (line 58, inside the `.map`), render the journal's icon. Replace the current `<Menu.Item>` content to include the icon:

```tsx
{visibleJournals.map((journal) => {
  const JournalIcon = getJournalIcon(journal.icon);
  return (
    <Menu.Item key={journal.id} id={journal.id}>
      <Menu.ItemIndicator variant="dot"/>
      <JournalIcon size={16} color={muted as string}/>
      <Menu.ItemTitle>{journal.name}</Menu.ItemTitle>
    </Menu.Item>
  );
})}
```

Note: This requires the `Journal` type to have the `icon` field (added in Task 1).

- [ ] **Step 2: Commit**

```bash
git add src/components/journal-select.tsx
git commit -m "feat: render dynamic icons in journal select"
```

---

## Task 12: Wire index.tsx (home screen) to DB

**Files:**
- Modify: `src/app/index.tsx`

This is the most complex task. The home screen needs:
- Real journal data from `useJournals()`
- Entry create-on-first-keystroke lifecycle
- Auto-save via `useAutoSave()`
- Emotion persistence
- CreateJournal wiring

- [ ] **Step 1: Rewrite index.tsx**

Replace the entire contents of `src/app/index.tsx`. Key changes from mock version:

1. Replace `MOCK_JOURNALS` with `useJournals()`
2. Add entry lifecycle state: `currentEntryId` (null until first keystroke)
3. On first text change with content: `createEntry()` → set `currentEntryId`
4. Track `htmlRef` and `textRef` for auto-save (refs, not state)
5. When text becomes empty and `currentEntryId` exists: `deleteEntry()` → reset
6. Pass `currentEntryId` + content to `useAutoSave()`
7. On check button: `saveEmotions()` → show animation → reset
8. Wire `CreateJournal` to `createJournal()`
9. Default selected journal to first in list

```tsx
import { router } from 'expo-router';
import { Check, History, Plus, SmilePlus } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';

import { Button } from 'heroui-native';

import { AppearanceToggle } from '@/components/appearance-toggle';
import { CreateJournal } from '@/components/create-journal';
import { Editor, type EditorHandle } from '@/components/editor';
import { EmotionCheckin } from '@/components/emotion-checkin';
import { EntrySaved } from '@/components/entry-saved';
import { JournalSelect } from '@/components/journal-select';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useEmotions } from '@/hooks/use-emotions';
import { useEntries } from '@/hooks/use-entries';
import { useJournals } from '@/hooks/use-journals';
import type { EmotionCategory, EmotionIntensity } from '@/types/common';

export default function HomeScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { journals, createJournal, refresh: refreshJournals } = useJournals();
  const { createEntry, deleteEntry, updateEntry } = useEntries();
  const { saveEmotions } = useEmotions();

  const [selectedJournalId, setSelectedJournalId] = useState<string | null>(null);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [hasContent, setHasContent] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [autoSaveContent, setAutoSaveContent] = useState({ html: '', text: '' });

  const [muted, surface, accentForeground] = useCSSVariable([
    '--color-muted',
    '--color-surface',
    '--color-accent-foreground',
  ]);

  const emotionSheetRef = useRef<BottomSheet>(null);
  const createSheetRef = useRef<BottomSheet>(null);
  const editorRef = useRef<EditorHandle>(null);
  const emotionSelectionsRef = useRef<Array<{ emotion: EmotionCategory; intensity: EmotionIntensity }>>([]);
  const htmlRef = useRef('');
  const textRef = useRef('');
  const isCreatingRef = useRef(false);

  const checkWidth = useSharedValue(0);
  const checkOpacity = useSharedValue(0);

  const checkButtonStyle = useAnimatedStyle(() => ({
    width: checkWidth.value,
    opacity: checkOpacity.value,
    paddingRight: 12,
    overflow: 'hidden' as const,
  }));

  // Default to first journal
  useEffect(() => {
    if (journals.length > 0 && !selectedJournalId) {
      setSelectedJournalId(journals[0]?.id ?? null);
    }
  }, [journals, selectedJournalId]);

  useAutoSave(currentEntryId, autoSaveContent);

  const handleTextChange = useCallback(
    async (text: string, html: string) => {
      const hasText = text.trim().length > 0;
      htmlRef.current = html;
      textRef.current = text;

      if (hasText && !currentEntryId && selectedJournalId && !isCreatingRef.current) {
        // First keystroke — create entry (guard prevents duplicates on fast typing)
        isCreatingRef.current = true;
        const entry = await createEntry(selectedJournalId, html, text);
        setCurrentEntryId(entry.id);
        isCreatingRef.current = false;
      } else if (!hasText && currentEntryId) {
        // All text deleted — remove entry
        await deleteEntry(currentEntryId);
        setCurrentEntryId(null);
      }

      if (currentEntryId) {
        setAutoSaveContent({ html, text });
      }

      setHasContent(hasText);
      checkWidth.value = withSpring(hasText ? 48 : 0);
      checkOpacity.value = withSpring(hasText ? 1 : 0);
    },
    [currentEntryId, selectedJournalId, createEntry, deleteEntry, checkWidth, checkOpacity],
  );

  const openEmotionCheckin = useCallback(() => {
    emotionSheetRef.current?.snapToIndex(0);
  }, []);

  const closeEmotionCheckin = useCallback(() => {
    emotionSheetRef.current?.close();
  }, []);

  const handleEmotionSave = useCallback(
    (selections: Array<{ emotion: EmotionCategory; intensity: EmotionIntensity }>) => {
      emotionSelectionsRef.current = selections;
      closeEmotionCheckin();
    },
    [closeEmotionCheckin],
  );

  const handleFinishEntry = useCallback(async () => {
    if (!currentEntryId) return;

    // Final save
    await updateEntry(currentEntryId, htmlRef.current, textRef.current);

    // Save emotions if any were selected
    if (emotionSelectionsRef.current.length > 0) {
      await saveEmotions(
        currentEntryId,
        emotionSelectionsRef.current.map((s) => ({
          category: s.emotion,
          intensity: s.intensity,
        })),
      );
    }

    setShowSaved(true);
  }, [currentEntryId, updateEntry, saveEmotions]);

  const handleSavedComplete = useCallback(() => {
    editorRef.current?.clear();
    setCurrentEntryId(null);
    setHasContent(false);
    setAutoSaveContent({ html: '', text: '' });
    htmlRef.current = '';
    textRef.current = '';
    emotionSelectionsRef.current = [];
    checkWidth.value = withSpring(0);
    checkOpacity.value = withSpring(0);
    setShowSaved(false);
  }, [checkWidth, checkOpacity]);

  const handleCreateJournal = useCallback(
    async (name: string, icon: string) => {
      const journal = await createJournal(name, icon);
      setSelectedJournalId(journal.id);
      createSheetRef.current?.close();
    },
    [createJournal],
  );

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-row items-center justify-between p-3 pr-0">
        <View className="flex-row items-center">
          <AppearanceToggle />
          <JournalSelect
            journals={journals}
            selectedId={selectedJournalId}
            onSelect={setSelectedJournalId}
            onCreate={() => createSheetRef.current?.expand()}
            onViewAll={() => router.push('/journals')}
          />
        </View>
        <View className="flex-row items-center">
          <Button variant="ghost" size="sm" isIconOnly onPress={() => router.push('/history')}>
            <History size={16} color={muted as string} />
          </Button>
          <Button variant="ghost" size="sm" isIconOnly onPress={openEmotionCheckin}>
            <SmilePlus size={16} color={muted as string} />
          </Button>
          <Animated.View style={checkButtonStyle}>
            <Button variant="primary" size="sm" isIconOnly onPress={handleFinishEntry}>
              <Check size={16} color={accentForeground as string} />
            </Button>
          </Animated.View>
        </View>
      </View>

      <Editor
        ref={editorRef}
        placeholder="What's on your mind?"
        onChangeText={(text) => handleTextChange(text, htmlRef.current)}
        onChangeHtml={(html) => {
          htmlRef.current = html;
          if (currentEntryId) {
            setAutoSaveContent({ html, text: textRef.current });
          }
        }}
      />

      {/* Emotion check-in bottom sheet */}
      <BottomSheet
        ref={emotionSheetRef}
        index={-1}
        enablePanDownToClose
        enableDynamicSizing
        animationConfigs={{}}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.5} />
        )}
        maxDynamicContentSize={insets.top > 0 ? undefined : 600}
        backgroundStyle={{ backgroundColor: surface as string }}
        handleIndicatorStyle={{ backgroundColor: muted as string }}
      >
        <BottomSheetScrollView>
          {/* Key by currentEntryId to reset internal state between entries */}
          <EmotionCheckin key={currentEntryId ?? 'new'} onSave={handleEmotionSave} />
        </BottomSheetScrollView>
      </BottomSheet>

      {/* Create journal bottom sheet */}
      <BottomSheet
        ref={createSheetRef}
        index={-1}
        enablePanDownToClose
        enableDynamicSizing
        animationConfigs={{}}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.5} />
        )}
        backgroundStyle={{ backgroundColor: surface as string }}
        handleIndicatorStyle={{ backgroundColor: muted as string }}
      >
        <BottomSheetView>
          <CreateJournal onCreate={handleCreateJournal} />
        </BottomSheetView>
      </BottomSheet>

      {showSaved ? <EntrySaved onComplete={handleSavedComplete} /> : null}
    </View>
  );
}
```

Important implementation notes:
- The `Editor` component's `onChangeText` callback provides text, and `onChangeHtml` provides HTML. Both are tracked in refs to avoid re-renders. The `handleTextChange` function receives text from `onChangeText` and reads HTML from `htmlRef`.
- `autoSaveContent` is state (not a ref) because `useAutoSave` needs to react to changes via its dependency array.
- `emotionSelectionsRef` stores emotion picks until the entry is finished — using a ref because it doesn't need to trigger re-renders.

- [ ] **Step 2: Commit**

```bash
git add src/app/index.tsx
git commit -m "feat: wire home screen to database with auto-save lifecycle"
```

---

## Task 13: Wire journals.tsx to DB

**Files:**
- Modify: `src/app/journals.tsx`

- [ ] **Step 1: Rewrite journals.tsx**

Replace the entire contents of `src/app/journals.tsx`. Key changes:

1. Replace `MOCK_JOURNALS` with `useJournals()`
2. Add search input (client-side filter by name)
3. Wire CreateJournal to real `createJournal()`
4. Show real entry counts
5. Render dynamic journal icons

```tsx
import { ArrowLeft, Plus, Search } from 'lucide-react-native';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';

import { Button, Card } from 'heroui-native';

import { CreateJournal } from '@/components/create-journal';
import { getJournalIcon } from '@/constants/journal-icons';
import { useJournals } from '@/hooks/use-journals';
import type { Journal } from '@/types/journal';

function JournalCard({
  journal,
  entryCount,
}: {
  readonly journal: Journal;
  readonly entryCount: number;
}): React.JSX.Element {
  const [muted] = useCSSVariable(['--color-muted']);
  const Icon = getJournalIcon(journal.icon);

  return (
    <Card>
      <Card.Body>
        <View className="flex-row items-center gap-3">
          <Icon size={20} color={muted as string} />
          <View className="flex-1">
            <Card.Title>{journal.name}</Card.Title>
            <Card.Description>
              {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
            </Card.Description>
          </View>
        </View>
      </Card.Body>
    </Card>
  );
}

export default function JournalsScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [muted, accentForeground, surface, foreground, border] = useCSSVariable([
    '--color-muted',
    '--color-accent-foreground',
    '--color-surface',
    '--color-foreground',
    '--color-border',
  ]);
  const sheetRef = useRef<BottomSheet>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { journals, entryCounts, createJournal } = useJournals();

  const filteredJournals = useMemo(() => {
    if (searchQuery.trim().length === 0) return journals;
    const query = searchQuery.toLowerCase();
    return journals.filter((j) => j.name.toLowerCase().includes(query));
  }, [journals, searchQuery]);

  const openSheet = useCallback(() => sheetRef.current?.expand(), []);
  const closeSheet = useCallback(() => sheetRef.current?.close(), []);

  const handleCreate = useCallback(
    async (name: string, icon: string) => {
      await createJournal(name, icon);
      closeSheet();
    },
    [createJournal, closeSheet],
  );

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="p-3">
        <Button variant="ghost" size="sm" isIconOnly onPress={() => router.back()}>
          <ArrowLeft size={20} color={muted as string} />
        </Button>
        <Text className="text-5xl font-heading text-foreground px-3">Journals</Text>
      </View>

      {/* Search input */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginHorizontal: 16,
          marginBottom: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
          backgroundColor: surface as string,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: border as string,
          gap: 8,
        }}
      >
        <Search size={16} color={muted as string} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search journals..."
          placeholderTextColor={muted as string}
          style={{ flex: 1, fontSize: 15, color: foreground as string, padding: 0 }}
        />
      </View>

      <FlatList
        data={filteredJournals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <JournalCard journal={item} entryCount={entryCounts.get(item.id) ?? 0} />
        )}
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: insets.bottom + 80,
          paddingHorizontal: 16,
          gap: 12,
        }}
      />

      <Button
        variant="primary"
        size="lg"
        isIconOnly
        onPress={openSheet}
        className="absolute bottom-8 right-5 w-14 h-14 rounded-full shadow-2xl"
        style={{ bottom: insets.bottom + 16 }}
      >
        <Plus size={24} color={accentForeground as string} />
      </Button>

      <BottomSheet
        ref={sheetRef}
        index={-1}
        enablePanDownToClose
        enableDynamicSizing
        animationConfigs={{}}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.5} />
        )}
        backgroundStyle={{ backgroundColor: surface as string }}
        handleIndicatorStyle={{ backgroundColor: muted as string }}
      >
        <BottomSheetView>
          <CreateJournal onCreate={handleCreate} />
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/journals.tsx
git commit -m "feat: wire journals screen to database with search"
```

---

## Task 14: Wire history.tsx to DB

**Files:**
- Modify: `src/app/history.tsx`

- [ ] **Step 1: Rewrite history.tsx**

Replace the entire contents of `src/app/history.tsx`. Key changes:

1. Replace `MOCK_ENTRIES` with `useEntries()`
2. Entry cards show content preview (first ~2 lines of `contentText`), journal name, date
3. Add search input using FTS5
4. Tap entry navigates to `entry/[id]`

```tsx
import { ChevronLeftIcon, Search } from 'lucide-react-native';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';

import { Button, Card } from 'heroui-native';

import { useEntries } from '@/hooks/use-entries';
import type { EntryWithJournal } from '@/services/entry-service';
import { formatRelativeDate } from '@/utils/date';

function EntryCard({
  entry,
  onPress,
}: {
  readonly entry: EntryWithJournal;
  readonly onPress: () => void;
}): React.JSX.Element {
  const preview = entry.contentText.slice(0, 120).trim();

  return (
    <Pressable onPress={onPress}>
      <Card>
        <Card.Body>
          <View>
            <View className="flex-row items-center justify-between">
              <Card.Title className="text-xs font-medium text-accent">
                {entry.journalName}
              </Card.Title>
            </View>
            <Card.Description className="font-editor text-sm mt-1" numberOfLines={2}>
              {preview || 'Empty entry'}
            </Card.Description>
            <View className="flex-row items-center justify-end">
              <Card.Description className="text-xs opacity-50">
                {formatRelativeDate(entry.createdAt)}
              </Card.Description>
            </View>
          </View>
        </Card.Body>
      </Card>
    </Pressable>
  );
}

export default function HistoryScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [muted, surface, foreground, border] = useCSSVariable([
    '--color-muted',
    '--color-surface',
    '--color-foreground',
    '--color-border',
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const { entries, searchEntries } = useEntries();

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      await searchEntries(query);
    },
    [searchEntries],
  );

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="p-3 gap-1">
        <Button variant="ghost" size="sm" isIconOnly onPress={() => router.back()}>
          <ChevronLeftIcon size={20} color={muted as string} />
        </Button>
        <Text className="text-5xl font-heading text-foreground ml-2 pb-2">History</Text>
      </View>

      {/* Search input */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginHorizontal: 16,
          marginBottom: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
          backgroundColor: surface as string,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: border as string,
          gap: 8,
        }}
      >
        <Search size={16} color={muted as string} />
        <TextInput
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search entries..."
          placeholderTextColor={muted as string}
          style={{ flex: 1, fontSize: 15, color: foreground as string, padding: 0 }}
        />
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EntryCard
            entry={item}
            onPress={() => router.push(`/entry/${item.id}`)}
          />
        )}
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: insets.bottom + 16,
          paddingHorizontal: 16,
          gap: 12,
        }}
      />
    </View>
  );
}
```

- [ ] **Step 2: Add formatRelativeDate to date utils**

The function does not currently exist in `src/utils/date.ts`. Add it:

```ts
export function formatRelativeDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/history.tsx src/utils/date.ts
git commit -m "feat: wire history screen to database with FTS5 search"
```

---

## Task 15: Read-only entry view

**Files:**
- Create: `src/app/entry/[id]/index.tsx`

Note: This must be `entry/[id]/index.tsx` (not `entry/[id].tsx`) because `entry/[id]/edit.tsx` also exists. Expo Router cannot have both a file and a directory with the same name.

- [ ] **Step 1: Create entry/[id]/index.tsx**

This screen loads an entry by ID and displays it read-only. Shows content, emotions, journal name, and date. Has an edit FAB.

```tsx
import { ChevronLeft, Pencil } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';

import { Button } from 'heroui-native';

import { EMOTION_LABELS } from '@/constants/emotions';
import { useEntries } from '@/hooks/use-entries';
import type { EntryWithEmotions } from '@/services/entry-service';
import type { EmotionCategory } from '@/types/common';
import { formatRelativeDate } from '@/utils/date';

export default function EntryViewScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [muted, accentForeground, accent] = useCSSVariable([
    '--color-muted',
    '--color-accent-foreground',
    '--color-accent',
  ]);
  const { loadEntry } = useEntries();
  const [entry, setEntry] = useState<EntryWithEmotions | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadEntry(id).then((result) => {
        setEntry(result);
        setIsLoading(false);
      });
    }
  }, [id, loadEntry]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted">Loading...</Text>
      </View>
    );
  }

  if (!entry) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted">Entry not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="p-3">
        <Button variant="ghost" size="sm" isIconOnly onPress={() => router.back()}>
          <ChevronLeft size={20} color={muted as string} />
        </Button>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 80,
        }}
      >
        <Text className="text-xs text-muted mb-4">
          {formatRelativeDate(entry.createdAt)}
        </Text>

        <Text
          className="font-editor text-foreground"
          style={{ fontSize: 17, lineHeight: 28 }}
        >
          {entry.contentText}
        </Text>

        {entry.emotions.length > 0 ? (
          <View style={{ marginTop: 24, gap: 8 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '500',
                letterSpacing: 3,
                color: muted as string,
              }}
            >
              EMOTIONS
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {entry.emotions.map((emotion) => (
                <View
                  key={emotion.id}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: accent as string,
                  }}
                >
                  <Text style={{ fontSize: 13, color: accent as string }}>
                    {EMOTION_LABELS[emotion.category as EmotionCategory]} · {emotion.intensity}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Edit FAB */}
      <Button
        variant="primary"
        size="lg"
        isIconOnly
        onPress={() => router.push(`/entry/${id}/edit`)}
        className="absolute bottom-8 right-5 w-14 h-14 rounded-full shadow-2xl"
        style={{ bottom: insets.bottom + 16 }}
      >
        <Pencil size={20} color={accentForeground as string} />
      </Button>
    </View>
  );
}
```

Note: This renders `contentText` as plain text. If you want to render HTML with formatting, investigate whether `EnrichedTextInput` supports an `editable={false}` mode. If it does, swap the `<Text>` for a read-only `<EnrichedTextInput>`. If not, plain text is acceptable for MVP.

- [ ] **Step 2: Commit**

```bash
git add src/app/entry/
git commit -m "feat: add read-only entry view screen"
```

---

## Task 16: Entry edit screen

**Files:**
- Create: `src/app/entry/[id]/edit.tsx`

- [ ] **Step 1: Create directory and edit.tsx**

First ensure the directory exists: `src/app/entry/[id]/`

Then create `src/app/entry/[id]/edit.tsx`:

```tsx
import { Check, ChevronLeft, SmilePlus } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';

import { Button } from 'heroui-native';

import { Editor, type EditorHandle } from '@/components/editor';
import { EmotionCheckin } from '@/components/emotion-checkin';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useEmotions } from '@/hooks/use-emotions';
import { useEntries } from '@/hooks/use-entries';
import type { EmotionCategory, EmotionIntensity } from '@/types/common';

export default function EntryEditScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [muted, surface, accentForeground] = useCSSVariable([
    '--color-muted',
    '--color-surface',
    '--color-accent-foreground',
  ]);

  const { loadEntry, updateEntry } = useEntries();
  const { saveEmotions, getEmotions } = useEmotions();

  const [isLoading, setIsLoading] = useState(true);
  const [defaultHtml, setDefaultHtml] = useState('');
  const [autoSaveContent, setAutoSaveContent] = useState({ html: '', text: '' });

  const editorRef = useRef<EditorHandle>(null);
  const emotionSheetRef = useRef<BottomSheet>(null);
  const htmlRef = useRef('');
  const textRef = useRef('');
  const emotionSelectionsRef = useRef<Array<{ emotion: EmotionCategory; intensity: EmotionIntensity }>>([]);

  // Load entry and existing emotions
  useEffect(() => {
    if (!id) return;

    Promise.all([loadEntry(id), getEmotions(id)]).then(([entry, emotions]) => {
      if (entry) {
        setDefaultHtml(entry.contentHtml);
        htmlRef.current = entry.contentHtml;
        textRef.current = entry.contentText;
        setAutoSaveContent({ html: entry.contentHtml, text: entry.contentText });
      }
      if (emotions.length > 0) {
        emotionSelectionsRef.current = emotions.map((e) => ({
          emotion: e.category,
          intensity: e.intensity,
        }));
      }
      setIsLoading(false);
    });
  }, [id, loadEntry, getEmotions]);

  useAutoSave(id ?? null, autoSaveContent);

  const handleEmotionSave = useCallback(
    (selections: Array<{ emotion: EmotionCategory; intensity: EmotionIntensity }>) => {
      emotionSelectionsRef.current = selections;
      emotionSheetRef.current?.close();
    },
    [],
  );

  const handleFinish = useCallback(async () => {
    if (!id) return;

    // Final save
    await updateEntry(id, htmlRef.current, textRef.current);

    // Save emotions
    if (emotionSelectionsRef.current.length > 0) {
      await saveEmotions(
        id,
        emotionSelectionsRef.current.map((s) => ({
          category: s.emotion,
          intensity: s.intensity,
        })),
      );
    }

    router.back();
  }, [id, updateEntry, saveEmotions]);

  if (isLoading) {
    return <View className="flex-1 bg-background" />;
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-row items-center justify-between p-3 pr-0">
        <Button variant="ghost" size="sm" isIconOnly onPress={() => router.back()}>
          <ChevronLeft size={20} color={muted as string} />
        </Button>
        <View className="flex-row items-center">
          <Button variant="ghost" size="sm" isIconOnly onPress={() => emotionSheetRef.current?.snapToIndex(0)}>
            <SmilePlus size={16} color={muted as string} />
          </Button>
          <View style={{ paddingRight: 12 }}>
            <Button variant="primary" size="sm" isIconOnly onPress={handleFinish}>
              <Check size={16} color={accentForeground as string} />
            </Button>
          </View>
        </View>
      </View>

      <Editor
        ref={editorRef}
        defaultValue={defaultHtml}
        placeholder="Start writing..."
        onChangeText={(text) => {
          textRef.current = text;
          setAutoSaveContent({ html: htmlRef.current, text });
        }}
        onChangeHtml={(html) => {
          htmlRef.current = html;
          setAutoSaveContent({ html, text: textRef.current });
        }}
      />

      <BottomSheet
        ref={emotionSheetRef}
        index={-1}
        enablePanDownToClose
        enableDynamicSizing
        animationConfigs={{}}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.5} />
        )}
        maxDynamicContentSize={insets.top > 0 ? undefined : 600}
        backgroundStyle={{ backgroundColor: surface as string }}
        handleIndicatorStyle={{ backgroundColor: muted as string }}
      >
        <BottomSheetScrollView>
          <EmotionCheckin onSave={handleEmotionSave} />
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/entry/
git commit -m "feat: add entry edit screen with auto-save"
```

---

## Task 17: Verify and fix — end-to-end smoke test

**Files:** None (verification only)

- [ ] **Step 1: Check TypeScript compilation**

Run: `npx tsc --noEmit`

Fix any type errors that surface.

- [ ] **Step 2: Check for missing imports or broken references**

Run: `npx expo export --dump-sourcemap 2>&1 | head -50` or start the dev server and check for errors.

- [ ] **Step 3: Manual smoke test flow**

Test this sequence on a device or emulator:

1. App launches → editor is visible, journal selector works
2. Create a new journal via the "+" in journal select
3. Type in the editor → verify entry is created (check via DB inspection or by navigating to history)
4. Delete all text → verify entry is removed
5. Type again → finish via check button → animation plays → editor resets
6. Navigate to History → see the entry with content preview
7. Tap entry → read-only view loads
8. Tap edit FAB → edit screen loads with content
9. Make changes → go back → changes are auto-saved
10. Navigate to Journals → see real journal with entry count
11. Search in History → FTS5 returns results

- [ ] **Step 4: Fix any issues found and commit**

```bash
git add -A
git commit -m "fix: resolve issues from smoke testing"
```
