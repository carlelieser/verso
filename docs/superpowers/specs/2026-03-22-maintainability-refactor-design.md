# Maintainability Refactor — Design Spec

**Date:** 2026-03-22
**Goal:** Improve codebase maintainability by eliminating duplication, decomposing the largest component, and closing error handling gaps.

---

## 1. Layout Component Extraction

### Problem

Four layout patterns are copy-pasted across screens: safe-area wrapper + header, search input, FAB, and FlatList container styling. Changes to any pattern require editing 3–4 files.

### Solution

Extract three reusable components into `src/components/`:

#### `ScreenLayout`

Wraps list/detail screens with consistent structure. Does **not** wrap `EntryComposer`-based screens (home, edit) — those have their own layout managed by the composer.

```
Props:
  title?: ReactNode            — heading content (string or ReactNode for icon + text)
  showBackButton?: boolean     — renders ghost back button with ChevronLeft (default: true)
  headerRight?: ReactNode      — slot for right-side actions
  children: ReactNode
```

Handles:
- `useSafeAreaInsets().top` as paddingTop on outer View
- Back button: `Button variant="ghost" size="sm" isIconOnly`, `ChevronLeft` icon (standardized across screens), calls `router.back()`
- Title: `text-5xl font-heading text-foreground`
- Children rendered below header

`title` accepts `ReactNode` to support `journal/[id].tsx` which renders an icon next to the title text:
```tsx
<ScreenLayout
  title={
    <View className="flex-row items-center gap-3">
      {Icon ? <Icon size={28} color={muted} /> : null}
      <Text className="text-5xl font-heading text-foreground">{journal?.name}</Text>
    </View>
  }
>
```

Note: Back button icon is standardized to `ChevronLeft` across all screens. Currently `history.tsx` uses `ChevronLeftIcon` and others use `ChevronLeft` — these are the same icon, just different import names. Minor spacing differences (`gap-1`, `ml-2 pb-2`) will be normalized to one canonical layout.

#### `SearchInput`

Replaces the identical search bar in `journals.tsx`, `history.tsx`, `journal/[id].tsx`.

```
Props:
  value: string
  onChangeText: (text: string) => void
  placeholder?: string       — defaults to "Search..."
```

Handles:
- Search icon, TextInput, theme colors
- All inline styles consolidated into one place

Debouncing is **not** in scope for this component — callers handle their own async/debounce logic. This matches the current behavior where screens call `searchEntries` directly in `onChangeText`. Debouncing can be added later as a separate improvement.

#### `Fab`

Replaces the floating action button in `journals.tsx`, `journal/[id].tsx`, `entry/[id]/index.tsx`.

```
Props:
  icon: ReactNode
  onPress: () => void
```

Handles:
- Absolute positioning, `insets.bottom + 16`, `w-14 h-14 rounded-full shadow-2xl`
- Encapsulates `Button variant="primary" size="lg" isIconOnly` — consumers don't set these
- Consistent accent color

Icon size is the caller's responsibility (passed as part of the `icon` ReactNode). Current usage: `<Fab icon={<Plus size={24} ... />} />` and `<Fab icon={<Pencil size={20} ... />} />`.

### Screens After Extraction

Each screen drops ~40–60 lines of boilerplate. Example:

```tsx
// Before: journals.tsx
<View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
  <View className="p-3 gap-1">
    <Button variant="ghost" ...><ChevronLeft .../></Button>
    <Text className="text-5xl font-heading ...">Journals</Text>
  </View>
  <View style={{ flexDirection: 'row', ... }}> {/* 15 lines of search styling */}
  </View>
  <FlatList ... />
  <Button className="absolute bottom-8 right-5 ..." ...> {/* FAB */} </Button>
</View>

// After:
<ScreenLayout title="Journals">
  <SearchInput value={query} onChangeText={handleSearch} placeholder="Search journals..." />
  <FlatList ... />
  <Fab icon={<Plus ... />} onPress={handleCreate} />
</ScreenLayout>
```

---

## 2. EntryComposer Decomposition

### Problem

`entry-composer.tsx` is 332 lines with mixed concerns: entry CRUD orchestration, auto-save, emotion sheet management, journal creation sheet, animation logic, and imperative handle.

### Solution

#### `useEntryComposer(options)` hook (~120 lines)

```
Options:
  entryId?: string | null
  initialJournalId?: string | null
  isAnimatedCheck?: boolean
  onFinish?: (entryId: string) => void

Returns:
  // State
  selectedJournalId: string | null
  setSelectedJournalId: (id: string) => void
  currentEntryId: string | null
  hasContent: boolean
  isLoading: boolean
  defaultHtml: string
  defaultEmotions: readonly EmotionSelection[]

  // Refs
  htmlRef: MutableRefObject<string>
  textRef: MutableRefObject<string>
  emotionSelectionsRef: MutableRefObject<EmotionSelection[]>
  editorRef: RefObject<EditorHandle>

  // Handlers
  handleTextChange: (text: string, html: string) => Promise<void>
  handleEmotionSave: (selections: readonly EmotionSelection[]) => void
  handleFinish: () => Promise<void>
  handleCreateJournal: (name: string, icon: string) => Promise<void>
  handleClear: () => void

  // Animation
  checkButtonStyle: AnimatedStyleProp
```

Owns:
- All refs (`htmlRef`, `textRef`, `emotionSelectionsRef`, `editorRef`, `isCreatingRef`)
- All state (`selectedJournalId`, `currentEntryId`, `hasContent`, `isLoading`, `defaultHtml`, `defaultEmotions`, `autoSaveContent`)
- The `useAutoSave` integration (called inside the hook, not the component)
- Auto-create on first text, auto-delete on empty text
- Check button animation (Reanimated shared values + animated style)
- Load existing entry + emotions effect (edit mode)
- Default journal selection effect

**`forwardRef` / `useImperativeHandle` contract:**
The component retains `forwardRef` and `useImperativeHandle`, but delegates to `handleClear` from the hook:
```tsx
useImperativeHandle(forwardedRef, () => ({
  clear: handleClear,
}));
```
The `handleClear` function in the hook resets all refs, state, and triggers `editorRef.current?.clear()`. The home screen's `composerRef.current?.clear()` call continues to work unchanged.

#### `useBottomSheet(options?)` hook (~25 lines)

```
Options:
  maxDynamicContentSize?: number  — passed through to BottomSheet

Returns:
  ref: RefObject<BottomSheet>
  isOpen: boolean
  open: () => void
  close: () => void
  sheetProps: object  — spread onto BottomSheet (animationConfigs, enablePanDownToClose,
                         enableDynamicSizing, onClose, backgroundStyle, handleIndicatorStyle,
                         backdropComponent, maxDynamicContentSize)
```

- Manages the `isOpen` boolean and conditional rendering pattern (current approach: mount on open, unmount on close)
- Applies shared `BOTTOM_SHEET_ANIMATION_CONFIG` internally
- Applies theme colors (`surface`, `muted`) for background/handle indicator
- Returns `sheetProps` to spread onto `BottomSheet`, so consumers just write:
  ```tsx
  {emotionSheet.isOpen ? (
    <BottomSheet ref={emotionSheet.ref} {...emotionSheet.sheetProps}>
      <BottomSheetScrollView>...</BottomSheetScrollView>
    </BottomSheet>
  ) : null}
  ```

The emotion sheet passes `maxDynamicContentSize={insets.top > 0 ? undefined : 600}` via the options. The create-journal sheet uses the default (no max).

#### `EntryComposer` component (~100 lines)

Pure JSX: toolbar, editor, two bottom sheets. All logic and state from hooks.

```tsx
export const EntryComposer = forwardRef<EntryComposerHandle, EntryComposerProps>(
  function EntryComposer(props, forwardedRef) {
    const composer = useEntryComposer({ ... });
    const emotionSheet = useBottomSheet({ maxDynamicContentSize: ... });
    const createSheet = useBottomSheet();
    const { journals } = useJournals();

    useImperativeHandle(forwardedRef, () => ({ clear: composer.handleClear }));

    return ( /* JSX only */ );
  },
);
```

`EntryComposerProps` interface is unchanged — the home screen and edit screen continue to use the same API.

---

## 3. Error Handling

### Problem

- `useEntries`, `useJournals`, and `useEmotions` don't expose error state — service failures crash components.
- Domain error classes exist in `domain-errors.ts` but services never throw them.

### Solution

#### Hook error state

Add to `UseEntriesResult`, `UseJournalsResult`, and `UseEmotionsResult`:

```
error: Error | null
```

- Service calls wrapped in try/catch; caught errors stored in state.
- `refresh()` clears error before retrying.
- Screens can render inline error UI when `error` is non-null.

`useEmotions` is included because its `getEmotions` call in `EntryComposer` currently has no `.catch()` — if it fails, the error is silently swallowed.

#### Domain errors in services

- `getEntry()` throws `EntryNotFoundError` when query returns null.
- `deleteEntry()` / `deleteJournal()` throw respective `NotFoundError` if target doesn't exist.
- Add `ValidationError` to `domain-errors.ts`.
- Services validate inputs with guard clauses: emotion intensity must be 1–5, entry content must be non-empty.

---

## 4. Type Relocations

### Problem

`EntryWithJournal` and `EntryWithEmotions` are defined in `entry-service.ts`, not discoverable from `types/`.

### Solution

Move both interfaces to `src/types/entry.ts`. Update imports in:
- `src/services/entry-service.ts`
- `src/app/entry/[id]/index.tsx` (imports `EntryWithEmotions` from service)
- Any other consumers

---

## 5. JournalCard Extraction

### Problem

`JournalCard` is defined inline inside `journals.tsx`. Inconsistent with `entry-card.tsx` which has its own file.

### Solution

Extract to `src/components/journal-card.tsx`. Same pattern as `entry-card.tsx`.

---

## 6. Shared Animation Config

### Problem

`animationConfigs={{}}` is duplicated inline wherever bottom sheets are used, per a known HeroUI/gorhom compatibility requirement.

### Solution

Create `src/constants/animation.ts`:

```ts
export const BOTTOM_SHEET_ANIMATION_CONFIG = {};
```

`useBottomSheet()` hook applies this internally, so consumers don't need to know about it.

---

## 7. DatabaseProvider Retry

### Problem

If DB initialization, migrations, or seeding fails, the user sees an error with no way to recover.

### Solution

**Seed/FTS failure retry:** Add a "Retry" button to the seed error screen. On press, clear `seedError` and `isSeeded` state, re-run `ensureGuestUser` + `setupFts`.

**Migration failure retry:** The `useRunMigrations` hook returns `{ success, error }` with no retry mechanism. To retry, use a `key` prop on `DatabaseProviderInner` — incrementing the key forces a remount, which re-runs the migration hook from scratch:

```tsx
// In DatabaseProvider
const [retryKey, setRetryKey] = useState(0);
return <DatabaseProviderInner key={retryKey} db={db} onRetry={() => setRetryKey(k => k + 1)}>{children}</DatabaseProviderInner>;
```

**DB init failure retry:** Add a "Retry" button that clears `initError` and re-triggers `createDatabase()` via a retry counter in the effect dependency array.

---

## 8. FTS Documentation

### Problem

FTS triggers in `fts.ts` depend on specific columns in the `entries` table (`content_text`). This coupling is undocumented — schema changes could break search silently.

### Solution

- Add comment in `schema.ts` on the `entries` table: `// content_text is mirrored by FTS triggers — see fts.ts`
- Add comment in `fts.ts`: `// Depends on entries.content_text column — update triggers if schema changes`

---

## Files Changed

| File | Action |
|------|--------|
| `src/components/screen-layout.tsx` | **New** — shared screen wrapper |
| `src/components/search-input.tsx` | **New** — shared search bar |
| `src/components/fab.tsx` | **New** — shared floating action button |
| `src/components/journal-card.tsx` | **New** — extracted from journals.tsx |
| `src/hooks/use-entry-composer.ts` | **New** — orchestration logic from EntryComposer |
| `src/hooks/use-bottom-sheet.ts` | **New** — reusable sheet open/close/ref |
| `src/constants/animation.ts` | **New** — bottom sheet animation config |
| `src/components/entry-composer.tsx` | **Modified** — reduced to ~100 lines of JSX |
| `src/hooks/use-entries.ts` | **Modified** — add error state |
| `src/hooks/use-journals.ts` | **Modified** — add error state |
| `src/hooks/use-emotions.ts` | **Modified** — add error state |
| `src/services/entry-service.ts` | **Modified** — throw domain errors, validate inputs, move types out |
| `src/services/emotion-service.ts` | **Modified** — validate inputs |
| `src/services/journal-service.ts` | **Modified** — throw domain errors |
| `src/errors/domain-errors.ts` | **Modified** — add ValidationError |
| `src/types/entry.ts` | **Modified** — add EntryWithJournal, EntryWithEmotions |
| `src/providers/database-provider.tsx` | **Modified** — add retry buttons, key-based remount for migrations |
| `src/db/schema.ts` | **Modified** — add FTS coupling comment |
| `src/db/fts.ts` | **Modified** — add schema dependency comment |
| `src/app/index.tsx` | **Modified** — may need import updates if EntryComposer props change |
| `src/app/journals.tsx` | **Modified** — use ScreenLayout, SearchInput, Fab; remove JournalCard |
| `src/app/history.tsx` | **Modified** — use ScreenLayout, SearchInput |
| `src/app/journal/[id].tsx` | **Modified** — use ScreenLayout, SearchInput, Fab |
| `src/app/entry/[id]/index.tsx` | **Modified** — use ScreenLayout, Fab; update EntryWithEmotions import |
| `src/app/entry/[id]/edit.tsx` | **Modified** — use ScreenLayout |

**7 new files, 18 modified files. No files deleted.**
