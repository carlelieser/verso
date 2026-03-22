# Maintainability Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate layout duplication across screens, decompose EntryComposer into focused units, add error handling to hooks/services, and clean up minor quality gaps.

**Architecture:** Extract shared layout components (ScreenLayout, SearchInput, Fab) to DRY up screens. Pull EntryComposer's orchestration logic into a `useEntryComposer` hook and bottom sheet management into a `useBottomSheet` hook. Add error state to data hooks and wire existing domain error classes into services.

**Tech Stack:** TypeScript 5.x, React Native 0.84+, Expo Router, HeroUI Native, Reanimated, gorhom/bottom-sheet, Drizzle ORM

**Spec:** `docs/superpowers/specs/2026-03-22-maintainability-refactor-design.md`

---

### Task 1: Add ValidationError to domain errors

**Files:**
- Modify: `src/errors/domain-errors.ts`

- [ ] **Step 1: Add ValidationError class**

```typescript
export class ValidationError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'ValidationError';
  }
}
```

Append this class after `StorageFullError` in `src/errors/domain-errors.ts`.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/errors/domain-errors.ts
git commit -m "feat: add ValidationError to domain errors"
```

---

### Task 2: Move EntryWithJournal and EntryWithEmotions to types

**Files:**
- Modify: `src/types/entry.ts`
- Modify: `src/services/entry-service.ts`
- Modify: `src/hooks/use-entries.ts`
- Modify: `src/app/entry/[id]/index.tsx`

- [ ] **Step 1: Add interfaces to types/entry.ts**

Add after the `Entry` interface in `src/types/entry.ts`:

```typescript
import type { EmotionRecord } from './emotion';

export interface EntryWithJournal extends Entry {
  readonly journalName: string;
}

export interface EntryWithEmotions extends Entry {
  readonly emotions: readonly EmotionRecord[];
}
```

Update the existing `Timestamp` import to also import `EmotionRecord` from the emotion types.

- [ ] **Step 2: Remove interfaces from entry-service.ts, re-import from types**

In `src/services/entry-service.ts`:
- Remove the `EntryWithJournal` and `EntryWithEmotions` interface definitions (lines 31–37).
- Update the import from `@/types/entry` to include `EntryWithJournal` and `EntryWithEmotions`:

```typescript
import type { Entry, EntryWithEmotions, EntryWithJournal } from '@/types/entry';
```

- [ ] **Step 3: Update use-entries.ts imports**

In `src/hooks/use-entries.ts`, change:

```typescript
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
```

To:

```typescript
import {
  createEntry as createEntryService,
  deleteEntry as deleteEntryService,
  getEntry,
  listEntries as listEntriesService,
  searchEntries as searchEntriesService,
  updateEntry as updateEntryService,
} from '@/services/entry-service';
import type { EntryWithEmotions, EntryWithJournal } from '@/types/entry';
```

- [ ] **Step 4: Update entry view screen import**

In `src/app/entry/[id]/index.tsx`, change:

```typescript
import type { EntryWithEmotions } from '@/services/entry-service';
```

To:

```typescript
import type { EntryWithEmotions } from '@/types/entry';
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/types/entry.ts src/services/entry-service.ts src/hooks/use-entries.ts src/app/entry/\[id\]/index.tsx
git commit -m "refactor: move EntryWithJournal and EntryWithEmotions to types/entry"
```

---

### Task 3: Wire domain errors into services and add input validation

**Files:**
- Modify: `src/services/entry-service.ts`
- Modify: `src/services/journal-service.ts`
- Modify: `src/services/emotion-service.ts`

- [ ] **Step 1: Add domain error throws to entry-service.ts**

In `src/services/entry-service.ts`, add imports at the top:

```typescript
import { EntryNotFoundError } from '@/errors/domain-errors';
```

Modify `getEntry` — replace `if (!row) return null;` with:

```typescript
if (!row) throw new EntryNotFoundError(id);
```

Also update the return type from `Promise<EntryWithEmotions | null>` to `Promise<EntryWithEmotions>`.

Modify `deleteEntry` — add existence check before delete:

```typescript
export async function deleteEntry(db: Db, id: string): Promise<void> {
  const [existing] = await db.select({ id: entries.id }).from(entries).where(eq(entries.id, id)).limit(1);
  if (!existing) throw new EntryNotFoundError(id);
  await db.delete(entries).where(eq(entries.id, id));
}
```

- [ ] **Step 2: Update loadEntry callers for non-null return**

In `src/hooks/use-entries.ts`, update `loadEntry` return type:

```typescript
readonly loadEntry: (id: string) => Promise<EntryWithEmotions>;
```

And the implementation:

```typescript
const loadEntry = useCallback(
  async (id: string): Promise<EntryWithEmotions> => {
    return getEntry(db, id);
  },
  [db],
);
```

In `src/app/entry/[id]/index.tsx`, the `loadEntry(id).then((result) => { ... })` call should handle the `EntryNotFoundError` case. Update the `useFocusEffect` callback:

```typescript
useFocusEffect(
  useCallback(() => {
    let isActive = true;

    if (id) {
      loadEntry(id)
        .then((result) => {
          if (isActive) {
            setEntry(result);
            setIsLoading(false);
          }
        })
        .catch(() => {
          if (isActive) {
            setEntry(null);
            setIsLoading(false);
          }
        });
    }

    return () => {
      isActive = false;
    };
  }, [id, loadEntry]),
);
```

- [ ] **Step 3: Add domain error throws to journal-service.ts**

In `src/services/journal-service.ts`, add import:

```typescript
import { JournalNotFoundError } from '@/errors/domain-errors';
```

Modify `deleteJournal`:

```typescript
export async function deleteJournal(db: Db, id: string): Promise<void> {
  const [existing] = await db.select({ id: journals.id }).from(journals).where(eq(journals.id, id)).limit(1);
  if (!existing) throw new JournalNotFoundError(id);
  await db.delete(journals).where(eq(journals.id, id));
}
```

- [ ] **Step 4: Add input validation to emotion-service.ts**

In `src/services/emotion-service.ts`, add import:

```typescript
import { ValidationError } from '@/errors/domain-errors';
```

Add validation **before** the delete so that invalid input doesn't destroy existing data:

```typescript
export async function saveEmotions(
  db: Db,
  entryId: string,
  emotions: readonly EmotionInput[],
): Promise<void> {
  // Validate BEFORE deleting existing records
  for (const e of emotions) {
    if (!isEmotionCategory(e.category)) {
      throw new ValidationError(`Invalid emotion category: ${e.category}`);
    }
    if (!isEmotionIntensity(e.intensity)) {
      throw new ValidationError(`Invalid emotion intensity: ${e.intensity}. Must be 1-5.`);
    }
  }

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
```

Add the missing imports for `isEmotionCategory` and `isEmotionIntensity`:

```typescript
import { isEmotionCategory, isEmotionIntensity } from '@/types/common';
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/services/entry-service.ts src/services/journal-service.ts src/services/emotion-service.ts src/hooks/use-entries.ts src/app/entry/\[id\]/index.tsx
git commit -m "feat: wire domain errors into services, add input validation"
```

---

### Task 4: Add error state to hooks

**Files:**
- Modify: `src/hooks/use-entries.ts`
- Modify: `src/hooks/use-journals.ts`
- Modify: `src/hooks/use-emotions.ts`

- [ ] **Step 1: Add error state to useEntries**

In `src/hooks/use-entries.ts`:

Add `error` to the interface:

```typescript
interface UseEntriesResult {
  readonly entries: readonly EntryWithJournal[];
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly refresh: (journalId?: string) => Promise<void>;
  readonly createEntry: (journalId: string, html: string, text: string) => Promise<Entry>;
  readonly updateEntry: (id: string, html: string, text: string, journalId?: string) => Promise<void>;
  readonly deleteEntry: (id: string) => Promise<void>;
  readonly loadEntry: (id: string) => Promise<EntryWithEmotions>;
  readonly searchEntries: (query: string) => Promise<void>;
}
```

Add state and wrap `refresh` in try/catch:

```typescript
const [error, setError] = useState<Error | null>(null);

const refresh = useCallback(
  async (filterJournalId?: string) => {
    try {
      setError(null);
      const list = await listEntriesService(db, {
        userId: GUEST_USER_ID,
        journalId: filterJournalId ?? journalId,
      });
      setEntries(list);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  },
  [db, journalId],
);
```

Add `error` to the return object.

- [ ] **Step 2: Add error state to useJournals**

In `src/hooks/use-journals.ts`:

Add `error` to the interface:

```typescript
readonly error: Error | null;
```

Add state and wrap `refresh` in try/catch:

```typescript
const [error, setError] = useState<Error | null>(null);

const refresh = useCallback(async () => {
  try {
    setError(null);
    const [journalList, counts] = await Promise.all([
      listJournals(db, GUEST_USER_ID),
      getJournalEntryCounts(db, GUEST_USER_ID),
    ]);
    setJournals(journalList);
    setEntryCounts(counts);
  } catch (err) {
    setError(err instanceof Error ? err : new Error(String(err)));
  } finally {
    setIsLoading(false);
  }
}, [db]);
```

Add `error` to the return object.

- [ ] **Step 3: Add error state to useEmotions**

In `src/hooks/use-emotions.ts`:

Add `error` to the interface and state:

```typescript
interface UseEmotionsResult {
  readonly saveEmotions: (entryId: string, emotions: readonly EmotionInput[]) => Promise<void>;
  readonly getEmotions: (entryId: string) => Promise<readonly EmotionRecord[]>;
  readonly error: Error | null;
}
```

```typescript
const [error, setError] = useState<Error | null>(null);

const saveEmotions = useCallback(
  async (entryId: string, emotions: readonly EmotionInput[]): Promise<void> => {
    try {
      setError(null);
      await saveEmotionsService(db, entryId, emotions);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  },
  [db],
);

const getEmotions = useCallback(
  async (entryId: string): Promise<readonly EmotionRecord[]> => {
    try {
      setError(null);
      return await getEmotionsService(db, entryId);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  },
  [db],
);
```

Add `useState` to the React imports. Add `error` to the return object.

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-entries.ts src/hooks/use-journals.ts src/hooks/use-emotions.ts
git commit -m "feat: add error state to useEntries, useJournals, useEmotions"
```

---

### Task 5: Create shared animation constant

**Files:**
- Create: `src/constants/animation.ts`

- [ ] **Step 1: Create the constant file**

Create `src/constants/animation.ts`:

```typescript
/**
 * Empty animation config object that overrides gorhom/bottom-sheet's default
 * spring animation to match HeroUI Native's smoother spring on Android.
 *
 * @see feedback_bottomsheet_animation.md
 */
export const BOTTOM_SHEET_ANIMATION_CONFIG = {};
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/constants/animation.ts
git commit -m "refactor: extract shared bottom sheet animation config"
```

---

### Task 6: Create useBottomSheet hook

**Files:**
- Create: `src/hooks/use-bottom-sheet.ts`

- [ ] **Step 1: Create the hook**

Create `src/hooks/use-bottom-sheet.ts`:

```typescript
import { useCallback, useMemo, useRef, useState } from 'react';
import type BottomSheet from '@gorhom/bottom-sheet';
import { BottomSheetBackdrop, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';

import { BOTTOM_SHEET_ANIMATION_CONFIG } from '@/constants/animation';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface UseBottomSheetOptions {
  readonly maxDynamicContentSize?: number;
}

interface UseBottomSheetResult {
  readonly ref: React.MutableRefObject<BottomSheet | null>;
  readonly isOpen: boolean;
  readonly open: () => void;
  readonly close: () => void;
  readonly sheetProps: {
    readonly index: number;
    readonly enablePanDownToClose: boolean;
    readonly enableDynamicSizing: boolean;
    readonly animationConfigs: Record<string, never>;
    readonly onClose: () => void;
    readonly backdropComponent: (props: BottomSheetBackdropProps) => React.JSX.Element;
    readonly backgroundStyle: { readonly backgroundColor: string };
    readonly handleIndicatorStyle: { readonly backgroundColor: string };
    readonly maxDynamicContentSize?: number;
  };
}

export function useBottomSheet(options?: UseBottomSheetOptions): UseBottomSheetResult {
  const ref = useRef<BottomSheet>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { surface, muted } = useThemeColors();

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.5} />
    ),
    [],
  );

  const sheetProps = useMemo(
    () => ({
      index: 0,
      enablePanDownToClose: true,
      enableDynamicSizing: true,
      animationConfigs: BOTTOM_SHEET_ANIMATION_CONFIG,
      onClose: close,
      backdropComponent: renderBackdrop,
      backgroundStyle: { backgroundColor: surface },
      handleIndicatorStyle: { backgroundColor: muted },
      ...(options?.maxDynamicContentSize !== undefined && {
        maxDynamicContentSize: options.maxDynamicContentSize,
      }),
    }),
    [close, renderBackdrop, surface, muted, options?.maxDynamicContentSize],
  );

  return { ref, isOpen, open, close, sheetProps };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors. If there are type issues with `BottomSheetBackdrop` props, adjust the `backdropComponent` typing to use the actual type from `@gorhom/bottom-sheet`.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-bottom-sheet.ts
git commit -m "feat: create useBottomSheet hook with shared config"
```

---

### Task 7: Create ScreenLayout component

**Files:**
- Create: `src/components/screen-layout.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/screen-layout.tsx`:

```typescript
import { ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from 'heroui-native';

import { useThemeColors } from '@/hooks/use-theme-colors';

interface ScreenLayoutProps {
  /** Heading content — string for plain text, ReactNode for custom layout (e.g. icon + text). */
  readonly title?: React.ReactNode;
  /** Show back button with ChevronLeft icon. Defaults to true. */
  readonly showBackButton?: boolean;
  /** Slot for right-side header actions. */
  readonly headerRight?: React.ReactNode;
  readonly children: React.ReactNode;
}

export function ScreenLayout({
  title,
  showBackButton = true,
  headerRight,
  children,
}: ScreenLayoutProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { muted } = useThemeColors();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="p-3 gap-1">
        <View className="flex-row items-center justify-between">
          {showBackButton ? (
            <Button variant="ghost" size="sm" isIconOnly onPress={() => router.back()}>
              <ChevronLeft size={20} color={muted} />
            </Button>
          ) : null}
          {headerRight ?? null}
        </View>
        {title !== undefined ? (
          typeof title === 'string' ? (
            <Text className="text-5xl font-heading text-foreground ml-2 pb-2">{title}</Text>
          ) : (
            <View className="ml-2 pb-2">{title}</View>
          )
        ) : null}
      </View>
      {children}
    </View>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/screen-layout.tsx
git commit -m "feat: create ScreenLayout component for shared screen structure"
```

---

### Task 8: Create SearchInput component

**Files:**
- Create: `src/components/search-input.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/search-input.tsx`:

```typescript
import { Search } from 'lucide-react-native';
import React from 'react';
import { TextInput, View } from 'react-native';

import { useThemeColors } from '@/hooks/use-theme-colors';

interface SearchInputProps {
  readonly value: string;
  readonly onChangeText: (text: string) => void;
  readonly placeholder?: string;
}

export function SearchInput({
  value,
  onChangeText,
  placeholder = 'Search...',
}: SearchInputProps): React.JSX.Element {
  const { muted, surface, foreground, border } = useThemeColors();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: border,
        gap: 8,
      }}
    >
      <Search size={16} color={muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={muted}
        style={{ flex: 1, fontSize: 15, color: foreground, padding: 0 }}
      />
    </View>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/search-input.tsx
git commit -m "feat: create SearchInput component"
```

---

### Task 9: Create Fab component

**Files:**
- Create: `src/components/fab.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/fab.tsx`:

```typescript
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from 'heroui-native';

interface FabProps {
  readonly icon: React.ReactNode;
  readonly onPress: () => void;
}

export function Fab({ icon, onPress }: FabProps): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <Button
      variant="primary"
      size="lg"
      isIconOnly
      onPress={onPress}
      className="absolute bottom-8 right-5 w-14 h-14 rounded-full shadow-2xl"
      style={{ bottom: insets.bottom + 16 }}
    >
      {icon}
    </Button>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/fab.tsx
git commit -m "feat: create Fab component"
```

---

### Task 10: Extract JournalCard to its own file

**Files:**
- Create: `src/components/journal-card.tsx`

- [ ] **Step 1: Create the component file**

Create `src/components/journal-card.tsx`:

```typescript
import React from 'react';
import { Pressable, View } from 'react-native';

import { Card } from 'heroui-native';

import { getJournalIcon } from '@/constants/journal-icons';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { Journal } from '@/types/journal';

interface JournalCardProps {
  readonly journal: Journal;
  readonly entryCount: number;
  readonly onPress: () => void;
}

export function JournalCard({ journal, entryCount, onPress }: JournalCardProps): React.JSX.Element {
  const { muted } = useThemeColors();
  const Icon = getJournalIcon(journal.icon);

  return (
    <Pressable onPress={onPress}>
      <Card>
        <Card.Body>
          <View className="flex-row items-center gap-3">
            <Icon size={20} color={muted} />
            <View className="flex-1">
              <Card.Title>{journal.name}</Card.Title>
              <Card.Description>
                {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
              </Card.Description>
            </View>
          </View>
        </Card.Body>
      </Card>
    </Pressable>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/journal-card.tsx
git commit -m "refactor: extract JournalCard to its own component file"
```

---

### Task 11: Refactor screens to use ScreenLayout, SearchInput, Fab

**Files:**
- Modify: `src/app/journals.tsx`
- Modify: `src/app/history.tsx`
- Modify: `src/app/journal/[id].tsx`
- Modify: `src/app/entry/[id]/index.tsx`

- [ ] **Step 1: Refactor journals.tsx**

Replace `src/app/journals.tsx` with:

```typescript
import { Plus } from 'lucide-react-native';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

import { CreateJournal } from '@/components/create-journal';
import { Fab } from '@/components/fab';
import { JournalCard } from '@/components/journal-card';
import { ScreenLayout } from '@/components/screen-layout';
import { SearchInput } from '@/components/search-input';
import { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { useJournals } from '@/hooks/use-journals';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function JournalsScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { accentForeground } = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');
  const { journals, entryCounts, createJournal } = useJournals();
  const sheet = useBottomSheet();

  const filteredJournals = useMemo(() => {
    if (searchQuery.trim().length === 0) return journals;
    const query = searchQuery.toLowerCase();
    return journals.filter((j) => j.name.toLowerCase().includes(query));
  }, [journals, searchQuery]);

  const handleCreate = useCallback(
    async (name: string, icon: string) => {
      await createJournal(name, icon);
      sheet.close();
    },
    [createJournal, sheet],
  );

  return (
    <ScreenLayout title="Journals">
      <SearchInput value={searchQuery} onChangeText={setSearchQuery} placeholder="Search journals..." />

      <FlatList
        data={filteredJournals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <JournalCard
            journal={item}
            entryCount={entryCounts.get(item.id) ?? 0}
            onPress={() => router.push(`/journal/${item.id}`)}
          />
        )}
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: insets.bottom + 80,
          paddingHorizontal: 16,
          gap: 12,
        }}
      />

      <Fab icon={<Plus size={24} color={accentForeground} />} onPress={sheet.open} />

      {sheet.isOpen ? (
        <BottomSheet ref={sheet.ref} {...sheet.sheetProps}>
          <BottomSheetView>
            <CreateJournal onCreate={handleCreate} />
          </BottomSheetView>
        </BottomSheet>
      ) : null}
    </ScreenLayout>
  );
}
```

Note: The `journals.tsx` bottom sheet currently uses `index={-1}` (always mounted). We're switching to the conditional render pattern for consistency with `useBottomSheet`. The behavior is identical — the sheet opens and closes the same way.

- [ ] **Step 2: Refactor history.tsx**

Replace `src/app/history.tsx` with:

```typescript
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EntryCard } from '@/components/entry-card';
import { ScreenLayout } from '@/components/screen-layout';
import { SearchInput } from '@/components/search-input';
import { useEntries } from '@/hooks/use-entries';

export default function HistoryScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
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
    <ScreenLayout title="History">
      <SearchInput value={searchQuery} onChangeText={handleSearch} placeholder="Search entries..." />

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EntryCard
            entry={item}
            showJournalName
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
    </ScreenLayout>
  );
}
```

- [ ] **Step 3: Refactor journal/[id].tsx**

Replace `src/app/journal/[id].tsx` with:

```typescript
import { Plus } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EntryCard } from '@/components/entry-card';
import { Fab } from '@/components/fab';
import { ScreenLayout } from '@/components/screen-layout';
import { SearchInput } from '@/components/search-input';
import { getJournalIcon } from '@/constants/journal-icons';
import { useEntries } from '@/hooks/use-entries';
import { useJournals } from '@/hooks/use-journals';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function JournalDetailScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { muted, accentForeground } = useThemeColors();
  const { journals } = useJournals();
  const journal = journals.find((j) => j.id === id);
  const { entries, searchEntries, createEntry } = useEntries(id);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      await searchEntries(query);
    },
    [searchEntries],
  );

  const handleNewEntry = useCallback(async () => {
    if (!id) return;
    const entry = await createEntry(id, '', '');
    router.push(`/entry/${entry.id}/edit`);
  }, [id, createEntry]);

  const Icon = journal ? getJournalIcon(journal.icon) : null;

  const titleContent = (
    <View className="flex-row items-center gap-3">
      {Icon ? <Icon size={28} color={muted} /> : null}
      <Text className="text-5xl font-heading text-foreground">
        {journal?.name ?? 'Journal'}
      </Text>
    </View>
  );

  return (
    <ScreenLayout title={titleContent}>
      <SearchInput value={searchQuery} onChangeText={handleSearch} placeholder="Search entries..." />

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
        ListEmptyComponent={
          <View className="items-center pt-12">
            <Text className="text-muted">No entries yet</Text>
          </View>
        }
      />

      <Fab icon={<Plus size={24} color={accentForeground} />} onPress={handleNewEntry} />
    </ScreenLayout>
  );
}
```

- [ ] **Step 4: Refactor entry/[id]/index.tsx**

Replace `src/app/entry/[id]/index.tsx` with:

```typescript
import { Pencil } from 'lucide-react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fab } from '@/components/fab';
import { ScreenLayout } from '@/components/screen-layout';
import { EMOTION_LABELS } from '@/constants/emotions';
import { useEntries } from '@/hooks/use-entries';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { EntryWithEmotions } from '@/types/entry';
import { formatRelativeDate } from '@/utils/date';

export default function EntryViewScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { muted, accentForeground, accent } = useThemeColors();
  const { loadEntry } = useEntries();
  const [entry, setEntry] = useState<EntryWithEmotions | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      if (id) {
        loadEntry(id)
          .then((result) => {
            if (isActive) {
              setEntry(result);
              setIsLoading(false);
            }
          })
          .catch(() => {
            if (isActive) {
              setEntry(null);
              setIsLoading(false);
            }
          });
      }

      return () => {
        isActive = false;
      };
    }, [id, loadEntry]),
  );

  return (
    <ScreenLayout>
      {isLoading || !entry ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">
            {isLoading ? 'Loading...' : 'Entry not found'}
          </Text>
        </View>
      ) : (
        <>
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
                    color: muted,
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
                        borderColor: accent,
                      }}
                    >
                      <Text style={{ fontSize: 13, color: accent }}>
                        {EMOTION_LABELS[emotion.category]} · {emotion.intensity}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </ScrollView>

          <Fab
            icon={<Pencil size={20} color={accentForeground} />}
            onPress={() => router.push(`/entry/${id}/edit`)}
          />
        </>
      )}
    </ScreenLayout>
  );
}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Manually verify on device/simulator**

Run: `npx expo start` and navigate through all screens:
- Home → History (check header, search, back button)
- Home → Journals (check header, search, FAB, create journal sheet)
- Journals → Journal detail (check icon in title, search, FAB, entries list)
- Journal detail → Entry view (check back button, content, emotions, edit FAB)

Expected: All screens look and behave identically to before the refactor.

- [ ] **Step 7: Commit**

```bash
git add src/app/journals.tsx src/app/history.tsx src/app/journal/\[id\].tsx src/app/entry/\[id\]/index.tsx
git commit -m "refactor: migrate screens to ScreenLayout, SearchInput, Fab"
```

---

### Task 12: Create useEntryComposer hook and slim down EntryComposer

**Files:**
- Create: `src/hooks/use-entry-composer.ts`
- Modify: `src/components/entry-composer.tsx`

- [ ] **Step 1: Create useEntryComposer hook**

Create `src/hooks/use-entry-composer.ts`:

```typescript
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ViewStyle } from 'react-native';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import type { EditorHandle } from '@/components/editor';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useEmotions } from '@/hooks/use-emotions';
import { useEntries } from '@/hooks/use-entries';
import { useJournals } from '@/hooks/use-journals';
import type { EmotionCategory, EmotionIntensity } from '@/types/common';

export interface EmotionSelection {
  readonly emotion: EmotionCategory;
  readonly intensity: EmotionIntensity;
}

interface UseEntryComposerOptions {
  readonly entryId?: string | null;
  readonly initialJournalId?: string | null;
  readonly isAnimatedCheck?: boolean;
  readonly onFinish?: (entryId: string) => void;
}

interface UseEntryComposerResult {
  // State
  readonly selectedJournalId: string | null;
  readonly setSelectedJournalId: (id: string) => void;
  readonly currentEntryId: string | null;
  readonly hasContent: boolean;
  readonly isLoading: boolean;
  readonly defaultHtml: string;
  readonly defaultEmotions: readonly EmotionSelection[];
  readonly journals: ReturnType<typeof useJournals>['journals'];

  // Refs
  readonly htmlRef: React.MutableRefObject<string>;
  readonly textRef: React.MutableRefObject<string>;
  readonly emotionSelectionsRef: React.MutableRefObject<EmotionSelection[]>;
  readonly editorRef: React.RefObject<EditorHandle | null>;

  // Handlers
  readonly handleTextChange: (text: string, html: string) => Promise<void>;
  readonly handleHtmlChange: (html: string) => void;
  readonly handleEmotionSave: (
    selections: readonly { readonly emotion: EmotionCategory; readonly intensity: EmotionIntensity }[],
  ) => void;
  readonly handleFinish: () => Promise<void>;
  readonly handleCreateJournal: (name: string, icon: string) => Promise<void>;
  readonly handleClear: () => void;

  // Animation
  readonly checkButtonStyle: ReturnType<typeof useAnimatedStyle>;
}

export function useEntryComposer({
  entryId: initialEntryId = null,
  initialJournalId = null,
  isAnimatedCheck = false,
  onFinish,
}: UseEntryComposerOptions): UseEntryComposerResult {
  const { createEntry, deleteEntry, updateEntry, loadEntry } = useEntries();
  const { saveEmotions, getEmotions } = useEmotions();
  const { journals, createJournal } = useJournals();

  const isEditMode = initialEntryId !== null;

  const [selectedJournalId, setSelectedJournalId] = useState<string | null>(initialJournalId);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(initialEntryId);
  const [hasContent, setHasContent] = useState(isEditMode);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [defaultHtml, setDefaultHtml] = useState('');
  const [defaultEmotions, setDefaultEmotions] = useState<readonly EmotionSelection[]>([]);
  const [autoSaveContent, setAutoSaveContent] = useState({ html: '', text: '' });

  const editorRef = useRef<EditorHandle>(null);
  const emotionSelectionsRef = useRef<EmotionSelection[]>([]);
  const htmlRef = useRef('');
  const textRef = useRef('');
  const isCreatingRef = useRef(false);

  const checkWidth = useSharedValue(isEditMode ? 48 : 0);
  const checkOpacity = useSharedValue(isEditMode ? 1 : 0);

  const checkButtonStyle = useAnimatedStyle((): ViewStyle => ({
    width: checkWidth.value,
    opacity: checkOpacity.value,
    paddingRight: 12,
    overflow: 'hidden',
  }));

  // Default to first journal in create mode
  useEffect(() => {
    if (!isEditMode && journals.length > 0 && !selectedJournalId) {
      setSelectedJournalId(journals[0]?.id ?? null);
    }
  }, [isEditMode, journals, selectedJournalId]);

  // Load existing entry + emotions in edit mode
  useEffect(() => {
    if (!initialEntryId) return;

    let isActive = true;

    Promise.all([loadEntry(initialEntryId), getEmotions(initialEntryId)])
      .then(([entry, emotions]) => {
        if (!isActive) return;

        setSelectedJournalId(entry.journalId);
        setDefaultHtml(entry.contentHtml);
        htmlRef.current = entry.contentHtml;
        textRef.current = entry.contentText;
        setAutoSaveContent({ html: entry.contentHtml, text: entry.contentText });

        if (emotions.length > 0) {
          const mapped = emotions.map((e) => ({
            emotion: e.category,
            intensity: e.intensity,
          }));
          emotionSelectionsRef.current = mapped;
          setDefaultEmotions(mapped);
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [initialEntryId, loadEntry, getEmotions]);

  useAutoSave(currentEntryId, autoSaveContent);

  const handleTextChange = useCallback(
    async (text: string, html: string) => {
      const hasText = text.trim().length > 0;
      htmlRef.current = html;
      textRef.current = text;

      if (!isEditMode) {
        if (hasText && !currentEntryId && selectedJournalId && !isCreatingRef.current) {
          isCreatingRef.current = true;
          const entry = await createEntry(selectedJournalId, html, text);
          setCurrentEntryId(entry.id);
          isCreatingRef.current = false;
        } else if (!hasText && currentEntryId) {
          await deleteEntry(currentEntryId);
          setCurrentEntryId(null);
        }
      }

      if (currentEntryId) {
        setAutoSaveContent({ html, text });
      }

      setHasContent(hasText);
      if (isAnimatedCheck) {
        checkWidth.value = withSpring(hasText ? 48 : 0);
        checkOpacity.value = withSpring(hasText ? 1 : 0);
      }
    },
    [isEditMode, isAnimatedCheck, currentEntryId, selectedJournalId, createEntry, deleteEntry, checkWidth, checkOpacity],
  );

  const handleHtmlChange = useCallback(
    (html: string) => {
      htmlRef.current = html;
      if (currentEntryId) {
        setAutoSaveContent({ html, text: textRef.current });
      }
    },
    [currentEntryId],
  );

  const handleEmotionSave = useCallback(
    (selections: readonly { readonly emotion: EmotionCategory; readonly intensity: EmotionIntensity }[]) => {
      emotionSelectionsRef.current = [...selections];
      setDefaultEmotions(selections);
    },
    [],
  );

  const handleFinish = useCallback(async () => {
    const entryId = currentEntryId;
    if (!entryId) return;

    await updateEntry(entryId, htmlRef.current, textRef.current, selectedJournalId ?? undefined);

    if (emotionSelectionsRef.current.length > 0) {
      await saveEmotions(
        entryId,
        emotionSelectionsRef.current.map((s) => ({
          category: s.emotion,
          intensity: s.intensity,
        })),
      );
    }

    onFinish?.(entryId);
  }, [currentEntryId, selectedJournalId, updateEntry, saveEmotions, onFinish]);

  const handleCreateJournal = useCallback(
    async (name: string, icon: string) => {
      const journal = await createJournal(name, icon);
      setSelectedJournalId(journal.id);
    },
    [createJournal],
  );

  const handleClear = useCallback(() => {
    editorRef.current?.clear();
    setCurrentEntryId(null);
    setHasContent(false);
    setAutoSaveContent({ html: '', text: '' });
    htmlRef.current = '';
    textRef.current = '';
    emotionSelectionsRef.current = [];
    checkWidth.value = withSpring(0);
    checkOpacity.value = withSpring(0);
  }, [checkWidth, checkOpacity]);

  return {
    selectedJournalId,
    setSelectedJournalId,
    currentEntryId,
    hasContent,
    isLoading,
    defaultHtml,
    defaultEmotions,
    journals,
    htmlRef,
    textRef,
    emotionSelectionsRef,
    editorRef,
    handleTextChange,
    handleHtmlChange,
    handleEmotionSave,
    handleFinish,
    handleCreateJournal,
    handleClear,
    checkButtonStyle,
  };
}
```

- [ ] **Step 2: Rewrite EntryComposer as thin JSX wrapper**

Replace `src/components/entry-composer.tsx` with:

```typescript
import { Check, SmilePlus } from 'lucide-react-native';
import React, { forwardRef, useImperativeHandle } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';

import { Button } from 'heroui-native';

import { AppearanceToggle } from '@/components/appearance-toggle';
import { CreateJournal } from '@/components/create-journal';
import { Editor } from '@/components/editor';
import { EmotionCheckin } from '@/components/emotion-checkin';
import { JournalSelect } from '@/components/journal-select';
import { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { useEntryComposer, type EmotionSelection } from '@/hooks/use-entry-composer';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { EmotionCategory, EmotionIntensity } from '@/types/common';

export interface EntryComposerHandle {
  clear: () => void;
}

interface EntryComposerProps {
  readonly entryId?: string | null;
  readonly initialJournalId?: string | null;
  readonly headerLeft?: React.ReactNode;
  readonly headerRight?: React.ReactNode;
  readonly onFinish?: (entryId: string) => void;
  readonly isAnimatedCheck?: boolean;
  readonly placeholder?: string;
  readonly onViewAllJournals?: () => void;
}

export const EntryComposer = forwardRef<EntryComposerHandle, EntryComposerProps>(
  function EntryComposer(
    {
      entryId = null,
      initialJournalId = null,
      headerLeft,
      headerRight,
      onFinish,
      isAnimatedCheck = false,
      placeholder = 'What\'s on your mind?',
      onViewAllJournals,
    },
    forwardedRef,
  ) {
    const insets = useSafeAreaInsets();
    const { muted, accentForeground } = useThemeColors();

    const composer = useEntryComposer({
      entryId,
      initialJournalId,
      isAnimatedCheck,
      onFinish,
    });

    const emotionSheet = useBottomSheet({
      maxDynamicContentSize: insets.top > 0 ? undefined : 600,
    });
    const createSheet = useBottomSheet();

    useImperativeHandle(forwardedRef, () => ({ clear: composer.handleClear }));

    const handleEmotionSave = (
      selections: readonly { readonly emotion: EmotionCategory; readonly intensity: EmotionIntensity }[],
    ) => {
      composer.handleEmotionSave(selections);
      emotionSheet.close();
    };

    const handleCreateJournal = async (name: string, icon: string) => {
      await composer.handleCreateJournal(name, icon);
      createSheet.close();
    };

    const checkButton = (
      <Button variant="primary" size="sm" isIconOnly onPress={composer.handleFinish}>
        <Check size={16} color={accentForeground} />
      </Button>
    );

    return (
      <>
        <View className="flex-1 bg-background" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
          {composer.isLoading ? <View className="flex-1" /> : (
          <>
          <View className="flex-row items-center justify-between p-3 pr-0">
            <View className="flex-row items-center">
              {headerLeft}
              <JournalSelect
                journals={composer.journals}
                selectedId={composer.selectedJournalId}
                onSelect={composer.setSelectedJournalId}
                onCreate={() => createSheet.open()}
                onViewAll={onViewAllJournals}
              />
            </View>
            <View className="flex-row items-center">
              <AppearanceToggle />
              {headerRight}
              <Button
                variant="ghost"
                size="sm"
                isIconOnly
                onPress={() => emotionSheet.open()}
              >
                <SmilePlus size={16} color={muted} />
              </Button>
              {isAnimatedCheck ? (
                <Animated.View style={composer.checkButtonStyle}>
                  {checkButton}
                </Animated.View>
              ) : (
                <View style={{ paddingRight: 12 }}>
                  {checkButton}
                </View>
              )}
            </View>
          </View>

          <Editor
            ref={composer.editorRef}
            defaultValue={composer.defaultHtml}
            placeholder={placeholder}
            onChangeText={(text) => composer.handleTextChange(text, composer.htmlRef.current)}
            onChangeHtml={composer.handleHtmlChange}
          />
          </>
          )}
        </View>

        {emotionSheet.isOpen ? (
          <BottomSheet ref={emotionSheet.ref} {...emotionSheet.sheetProps}>
            <BottomSheetScrollView>
              <EmotionCheckin
                key={composer.currentEntryId ?? 'new'}
                onSave={handleEmotionSave}
                defaultSelections={composer.defaultEmotions.length > 0 ? composer.defaultEmotions : undefined}
              />
            </BottomSheetScrollView>
          </BottomSheet>
        ) : null}

        {createSheet.isOpen ? (
          <BottomSheet ref={createSheet.ref} {...createSheet.sheetProps}>
            <BottomSheetView>
              <CreateJournal onCreate={handleCreateJournal} />
            </BottomSheetView>
          </BottomSheet>
        ) : null}
      </>
    );
  },
);
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Manually verify on device/simulator**

Test these flows:
1. **Home screen (create mode):** Type text → entry auto-creates → clear → entry auto-deletes
2. **Home screen emotions:** Open emotion sheet → select emotions → save → check button → verify saved overlay
3. **Home screen journal select:** Switch journal → create new journal via sheet
4. **Edit screen:** Navigate to entry → edit → verify auto-save → press check to finish → verify navigates back
5. **Animated check button:** On home screen, type → check button slides in → delete text → slides out

Expected: All flows behave identically to before.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-entry-composer.ts src/components/entry-composer.tsx
git commit -m "refactor: decompose EntryComposer into useEntryComposer hook + thin component"
```

---

### Task 13: Add retry UI to DatabaseProvider

**Files:**
- Modify: `src/providers/database-provider.tsx`

- [ ] **Step 1: Add retry to DB init error**

In `src/providers/database-provider.tsx`, add a retry counter and update the init error screen:

```typescript
export function DatabaseProvider({ children }: DatabaseProviderProps): React.JSX.Element {
  const [db, setDb] = useState<Db | null>(null);
  const [initError, setInitError] = useState<Error | null>(null);
  const [initAttempt, setInitAttempt] = useState(0);
  const [innerKey, setInnerKey] = useState(0);

  useEffect(() => {
    setInitError(null);
    createDatabase()
      .then((database) => {
        setDb(database);
      })
      .catch((error: unknown) => {
        setInitError(error instanceof Error ? error : new Error(String(error)));
      });
  }, [initAttempt]);

  if (initError) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-lg font-semibold text-danger">Failed to initialize database</Text>
        <Text className="mt-2 px-8 text-center text-sm text-muted">{initError.message}</Text>
        <Pressable
          onPress={() => setInitAttempt((n) => n + 1)}
          style={{ marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, backgroundColor: '#3b82f6' }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (!db) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
        <Text className="mt-3 text-base text-muted">Initializing...</Text>
      </View>
    );
  }

  return <DatabaseProviderInner key={innerKey} db={db} onRetry={() => setInnerKey((k) => k + 1)}>{children}</DatabaseProviderInner>;
}
```

Add `Pressable` to the React Native import.

- [ ] **Step 2: Add retry to inner provider errors**

Update `DatabaseProviderInner` to accept `onRetry` and add retry buttons:

```typescript
function DatabaseProviderInner({
  db,
  children,
  onRetry,
}: {
  readonly db: Db;
  readonly children: React.ReactNode;
  readonly onRetry: () => void;
}): React.JSX.Element {
  const { success, error } = useRunMigrations(db);
  const [isSeeded, setIsSeeded] = useState(false);
  const [seedError, setSeedError] = useState<Error | null>(null);
  const [seedAttempt, setSeedAttempt] = useState(0);

  useEffect(() => {
    if (success) {
      setSeedError(null);
      setupFts(db);
      ensureGuestUser(db)
        .then(() => {
          setIsSeeded(true);
        })
        .catch((err: unknown) => {
          setSeedError(err instanceof Error ? err : new Error(String(err)));
        });
    }
  }, [success, db, seedAttempt]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-lg font-semibold text-danger">Migration failed</Text>
        <Text className="mt-2 px-8 text-center text-sm text-muted">{error.message}</Text>
        <Pressable
          onPress={onRetry}
          style={{ marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, backgroundColor: '#3b82f6' }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (seedError) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-lg font-semibold text-danger">Database setup failed</Text>
        <Text className="mt-2 px-8 text-center text-sm text-muted">{seedError.message}</Text>
        <Pressable
          onPress={() => setSeedAttempt((n) => n + 1)}
          style={{ marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, backgroundColor: '#3b82f6' }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (!success || !isSeeded) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
        <Text className="mt-3 text-base text-muted">
          {success ? 'Setting up...' : 'Running migrations...'}
        </Text>
      </View>
    );
  }

  return <DatabaseContext.Provider value={{ db }}>{children}</DatabaseContext.Provider>;
}
```

Add `Pressable` to the React Native import at the top of the file.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/providers/database-provider.tsx
git commit -m "feat: add retry buttons to DatabaseProvider error screens"
```

---

### Task 14: Add FTS documentation comments

**Files:**
- Modify: `src/db/schema.ts`
- Modify: `src/db/fts.ts`

- [ ] **Step 1: Add comment to schema.ts**

In `src/db/schema.ts`, add a comment above the `entries` table definition (before line 33):

```typescript
/**
 * Journal entries table.
 *
 * NOTE: The `contentText` column is mirrored by FTS5 triggers defined in `fts.ts`.
 * If this column is renamed or removed, the FTS triggers must be updated in lockstep.
 */
export const entries = sqliteTable(
```

- [ ] **Step 2: Add comment to fts.ts**

In `src/db/fts.ts`, add a comment above the `setupFts` function (before line 4):

```typescript
/**
 * Creates the FTS5 virtual table and triggers for full-text search on entries.
 *
 * SCHEMA DEPENDENCY: These triggers reference the `entry` table's `content_text` column.
 * If `schema.ts` renames or removes `entries.contentText` (mapped to `content_text`),
 * these triggers must be updated to match.
 */
export function setupFts(db: Db): void {
```

- [ ] **Step 3: Commit**

```bash
git add src/db/schema.ts src/db/fts.ts
git commit -m "docs: document FTS trigger coupling between schema and fts"
```

---

### Task 15: Final verification

- [ ] **Step 1: Full TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Full app smoke test on device/simulator**

Run: `npx expo start` and test all flows:
1. Home → create entry → auto-save → add emotions → finish → saved animation → clear
2. Home → History → search → tap entry → view → edit FAB → edit → save → back
3. Home → Journals → search → create journal → tap journal → journal detail → search → create entry FAB
4. All back buttons work correctly
5. Dark/light theme toggle works on all screens

- [ ] **Step 3: Review diff for accidental changes**

Run: `git diff --stat main`
Expected: Only the files listed in the spec are changed. No accidental deletions or unintended modifications.

- [ ] **Step 4: Final commit if any cleanup needed**

If any issues found during smoke test, fix and commit separately.
