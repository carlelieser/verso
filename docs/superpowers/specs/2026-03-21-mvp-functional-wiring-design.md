# MVP Functional Wiring — Design Spec

Verso is a daily journal app built with React Native/Expo. The UI foundation exists (editor, emotion check-in, journal select, history, journals list) but everything uses mock data. This spec covers wiring the existing UI to a local SQLite database via Drizzle ORM, plus two new screens for viewing and editing entries.

**Scope:** Local-only MVP. No auth, sync, calendar, insights, settings, location, attachments, or transcription.

---

## Schema Change

Add an `icon` column to the `journals` table:

```
icon TEXT NOT NULL DEFAULT 'book-open'
```

This requires one new Drizzle migration. The CreateJournal component already has an icon picker — this persists the selection.

No title column on entries. Entry cards display the first ~2 lines of `contentText` as a preview.

---

## Database Initialization

The existing `client.ts` sets these PRAGMAs: `key`, `journal_mode = WAL`, `synchronous = NORMAL`, `cache_size = -8192`, `foreign_keys = ON`.

Add `PRAGMA recursive_triggers = ON` to ensure FTS triggers fire during cascade deletes (e.g., deleting a journal cascades to entries, which must update the FTS index).

---

## ID Generation

All primary keys are text UUIDs generated via `generateId()` from `src/utils/id.ts`, which wraps `randomUUID()` from `expo-crypto`.

---

## Service Layer

Three services. All are plain exported functions taking `db` (ExpoSQLiteDatabase) as the first argument. The `GUEST_USER_ID` constant is used for the userId in all operations.

### journal-service.ts

| Function | Signature | Notes |
|----------|-----------|-------|
| `listJournals` | `(db, userId) → Promise<Journal[]>` | Ordered by `displayOrder` |
| `createJournal` | `(db, { userId, name, icon }) → Promise<Journal>` | Auto-computes `displayOrder` as `MAX(displayOrder) + 1` for the user |
| `updateJournal` | `(db, { id, name?, icon? }) → Promise<void>` | Partial update |
| `deleteJournal` | `(db, id) → Promise<void>` | Cascades to entries via FK. `recursive_triggers` ensures FTS cleanup. |
| `getJournalEntryCounts` | `(db, userId) → Promise<Map<string, number>>` | Count of entries per journal |

### entry-service.ts

| Function | Signature | Notes |
|----------|-----------|-------|
| `createEntry` | `(db, { journalId, contentHtml, contentText }) → Promise<Entry>` | Returns the created entry |
| `updateEntry` | `(db, { id, contentHtml, contentText }) → Promise<void>` | Auto-save target |
| `deleteEntry` | `(db, id) → Promise<void>` | Cascades to emotions via FK |
| `getEntry` | `(db, id) → Promise<Entry & { emotions: EmotionRecord[] }>` | Single entry with emotions |
| `listEntries` | `(db, { journalId?, limit?, offset? }) → Promise<(Entry & { journalName: string })[]>` | Returns entries with journal name via join. When `journalId` is omitted, returns all entries for the guest user (joins through journals to filter by userId). Ordered by `createdAt` descending. |
| `searchEntries` | `(db, query) → Promise<(Entry & { journalName: string })[]>` | Uses raw SQL to query FTS5: `SELECT e.*, j.name as journal_name FROM entry_fts fts JOIN entry e ON e.rowid = fts.rowid JOIN journal j ON j.id = e.journal_id WHERE entry_fts MATCH ? ORDER BY rank`. Drizzle has no built-in FTS5 support, so this uses `db.$client` for the raw query. |

### emotion-service.ts

| Function | Signature | Notes |
|----------|-----------|-------|
| `saveEmotions` | `(db, entryId, emotions[]) → Promise<void>` | Delete-then-insert (replaces all emotions for the entry) |
| `getEmotions` | `(db, entryId) → Promise<EmotionRecord[]>` | For loading in edit screen |

---

## Hooks

Thin wrappers that call services using `useDatabaseContext()`.

### use-journals.ts

- Exposes: `journals`, `entryCounts`, `isLoading`
- Methods: `createJournal(name, icon)`, `updateJournal(id, ...)`, `deleteJournal(id)`
- Refreshes journal list and entry counts after any mutation
- Default journal selection: first journal by `displayOrder`. If no journals exist, prompt user to create one.

### use-entries.ts

- `listEntries(journalId?)` — returns entries with journal name for history screen
- `getEntry(id)` — single entry with emotions
- `createEntry(journalId, html, text)` → returns entry id
- `updateEntry(id, html, text)` — for auto-save
- `deleteEntry(id)`
- `searchEntries(query)` — FTS5 search results with journal name

### use-emotions.ts

- `saveEmotions(entryId, selections[])` — replace all emotions for an entry
- `getEmotions(entryId)` — load existing selections (for edit screen)

### use-auto-save.ts

- Debounced hook that calls `updateEntry` on content changes
- Takes entry ID, current HTML, and current text
- The home screen tracks both `html` and `text` in refs (not state, to avoid re-renders) and passes both to the hook, which debounces them as a pair
- Fires after 500ms debounce
- No-ops if entry ID is null (entry not yet created)

---

## Screens

### index.tsx (Home / Editor) — modify existing

The home screen is the writing surface. The user lands directly in the editor.

**New entry lifecycle (home screen only):**
1. App opens → editor is empty, no DB record exists
2. First keystroke → `createEntry()` → entry ID is now available, auto-save begins
3. Typing continues → debounced `updateEntry()` via use-auto-save
4. User deletes all text → `deleteEntry()` → back to step 1 (no entry in DB)
5. Check button (visible only when content exists) → save emotions → play EntrySaved animation → reset editor to step 1

**Wiring changes:**
- Replace `MOCK_JOURNALS` with `useJournals()` data
- Wire JournalSelect to real journals (rendering dynamic icons from journal data)
- Wire CreateJournal bottom sheet to `createJournal()`
- EmotionCheckin `onSave` writes emotions to the current entry via `saveEmotions()`
- Check button triggers the completion flow (save emotions, animation, reset)

### journals.tsx — modify existing

- Replace `MOCK_JOURNALS` with `useJournals()` + `entryCounts`
- Add search input at top — client-side filter by journal name (small list, no FTS needed)
- Wire CreateJournal to real `createJournal()`
- Journal cards show real entry counts
- Journal cards render the persisted icon (map icon string key to Lucide component)

### history.tsx — modify existing

- Replace `MOCK_ENTRIES` with `useEntries().listEntries()`
- Entry cards show: first ~2 lines of `contentText`, journal name, date
- Add search input — uses FTS5 `searchEntries(query)` when query is non-empty, falls back to `listEntries()` when empty
- Tap entry → navigate to `entry/[id]`

### entry/[id].tsx — new, read-only view

- Loads entry via `getEntry(id)`
- Renders content as read-only HTML. Use `EnrichedTextInput` from `react-native-enriched` with `editable={false}` if supported; otherwise fall back to `react-native-render-html` or a simple WebView.
- Shows: content, emotions (if any), journal name, date
- Edit FAB in bottom-right → navigates to `entry/[id]/edit`
- Back button → return to history

### entry/[id]/edit.tsx — new, edit screen

- Loads entry via `getEntry(id)`
- Editor component pre-populated with `defaultValue` from `contentHtml`
- Auto-save on changes (debounced `updateEntry`)
- Emotion check-in available, pre-loaded with existing selections via `getEmotions()`
- Check button → save current state + emotions → navigate back (no animation)
- **No delete-on-empty behavior** — the entry always persists regardless of content state. The user may be in the middle of rewriting.

---

## Component Changes

### emotion-checkin.tsx

The current component holds selections in local state but has no save/confirm button — `onSave` is declared in props but never called. Add a "Done" button at the bottom that calls `onSave(selections)` with the current selections, allowing the parent to persist them.

### journal-select.tsx

Currently hardcodes `BookOpen` as the icon for all journals. Modify to render the dynamic icon from each journal's `icon` field. Extract the icon string → Lucide component mapping from `create-journal.tsx`'s `ICONS` array into a shared constant (e.g., `src/constants/journal-icons.ts`).

### journals.tsx (JournalCard inline component)

Currently hardcodes `BookOpen`. Update to use the shared icon mapping to render each journal's persisted icon.

---

## Auto-Save Behavior Summary

| Context | Create on first keystroke | Delete on empty | Auto-save | Check button |
|---------|--------------------------|-----------------|-----------|-------------|
| Home (new entry) | Yes | Yes | Yes (after creation) | Save emotions → animation → reset |
| Edit screen | No (entry exists) | No | Yes | Save → navigate back |

---

## Files Changed/Created

| File | Action |
|------|--------|
| `src/db/schema.ts` | Add `icon` column to journals |
| `src/db/client.ts` | Add `PRAGMA recursive_triggers = ON` |
| `drizzle/NNNN_add_journal_icon.sql` | New migration |
| `src/services/journal-service.ts` | New |
| `src/services/entry-service.ts` | New |
| `src/services/emotion-service.ts` | New |
| `src/hooks/use-journals.ts` | New |
| `src/hooks/use-entries.ts` | New |
| `src/hooks/use-emotions.ts` | New |
| `src/hooks/use-auto-save.ts` | New |
| `src/constants/journal-icons.ts` | New — shared icon string → Lucide component mapping |
| `src/app/index.tsx` | Modify — wire to DB, auto-save lifecycle |
| `src/app/journals.tsx` | Modify — wire to DB, search, dynamic icons |
| `src/app/history.tsx` | Modify — wire to DB, search, entry navigation |
| `src/app/entry/[id].tsx` | New — read-only entry view |
| `src/app/entry/[id]/edit.tsx` | New — edit screen with auto-save |
| `src/types/journal.ts` | Add `icon` field to Journal type |
| `src/components/emotion-checkin.tsx` | Modify — add Done button that calls onSave |
| `src/components/journal-select.tsx` | Modify — render dynamic journal icons |

---

## Out of Scope

- Authentication / Supabase / PowerSync sync
- Calendar screen
- Insights / analytics screen
- Settings screens (appearance, export, reminders)
- Location tagging
- Attachments / photos
- Voice transcription (whisper.rn)
- Onboarding flow
- Tests (deferred to follow-up)
