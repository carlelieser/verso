# Entry Attachments — Design Spec

**Date:** 2026-03-25
**Goal:** Allow users to attach images, audio, and documents to journal entries, view them on the entry read page, and download/copy/share them.

---

## 1. Data Model

### Existing Infrastructure

The `attachments` SQLite table already exists in `src/db/schema.ts` with columns: id, entryId, type, uri, mimeType, fileName, sizeBytes, displayOrder, createdAt. Drizzle relations are wired (entries → many attachments). Cascade delete is configured.

### New Type

**`src/types/attachment.ts`**

```typescript
export type AttachmentType = 'image' | 'audio' | 'document';

export interface Attachment {
  readonly id: string;
  readonly entryId: string;
  readonly type: AttachmentType;
  readonly uri: string;
  readonly mimeType: string | null;
  readonly fileName: string | null;
  readonly sizeBytes: number | null;
  readonly displayOrder: number;
  readonly createdAt: Timestamp;
}
```

### Type Guard

**`src/types/attachment.ts`** — also export `isAttachmentType(value: string): value is AttachmentType` guard for validating the `type` column when reading rows from SQLite (same pattern as `isEmotionIntensity` in `common.ts`).

### EntryDetail Update

Add `readonly attachments: readonly Attachment[]` to `EntryDetail` in `src/types/entry.ts`. The `getEntry` function must always return an `attachments` array (empty `[]` if none exist) to satisfy the type contract.

---

## 2. File Storage

### Strategy

Files are copied from their picker URI to the app's document directory on selection:

```
${FileSystem.documentDirectory}attachments/${entryId}/${attachmentId}${ext}
```

- The picker URI is temporary and may be revoked — copy immediately.
- Use `expo-file-system` `copyAsync` for the copy.
- The stored `uri` column contains the app-local path.

### Directory Creation

Create `attachments/${entryId}/` directory on first attachment for that entry using `FileSystem.makeDirectoryAsync` with `intermediates: true`.

### File Cleanup on Entry Deletion

Update `deleteEntry` in `entry-service.ts` to delete the attachment directory from disk (`FileSystem.deleteAsync` on `attachments/${entryId}/`, with `idempotent: true`) before deleting the entry row. SQLite cascade handles DB row cleanup; this handles the files.

---

## 3. Service Layer

### `src/services/attachment-service.ts`

Functions following the same pattern as `entry-service.ts`:

- **`addAttachment(db, input)`** — Copies the file from the source URI to app storage, then inserts row into attachments table. Input: entryId, type, sourceUri, mimeType, fileName, sizeBytes. The service owns both the file copy and the DB insert as a single operation. If the DB insert fails after a successful copy, the copied file is deleted (rollback). Returns `Attachment`.
- **`deleteAttachment(db, id)`** — Queries the attachment for its URI, deletes the file from disk, then deletes the DB row.
- **`listAttachments(db, entryId)`** — Query all attachments for an entry, ordered by displayOrder then createdAt. Validates `type` column with `isAttachmentType` guard; skips rows with invalid types.

**`displayOrder` assignment:** New attachments are appended with `displayOrder = currentMaxOrder + 1` for the entry. When multiple files are picked at once, they receive sequential orders.

### Integration with Entry Loading

Update `getEntry` in `entry-service.ts` to query attachments via `listAttachments(db, id)` inside the existing `Promise.all` (parallel with emotions, location, weather). Include in the returned `EntryDetail`.

---

## 4. Attachment Picker

### `src/hooks/use-attachment-picker.ts`

A hook that exposes three pick functions and attachment state:

- **`pickImages()`** — Uses `expo-image-picker` with `launchImageLibraryAsync`, allows multiple selection, mediaTypes images only. Permissions are handled automatically by the Expo SDK.
- **`pickAudio()`** — Uses `expo-document-picker` with `getDocumentAsync`, type filter `audio/*`.
- **`pickDocuments()`** — Uses `expo-document-picker` with `getDocumentAsync`, type filter `*/*` (general documents).

Each function:
1. Launches the appropriate picker
2. If cancelled, returns early (no-op)
3. For each selected file: calls `addAttachment` service (which handles copy + insert)
4. Updates local `attachments` state array (via `useState`)

The hook takes `entryId` as a parameter and returns `{ attachments, pickImages, pickAudio, pickDocuments, refresh }`.

**State flow for attachment count:** The hook maintains a `useState<readonly Attachment[]>` initialized by loading from DB on mount. Each successful pick appends to this state. The composer reads `attachments.length > 0` to color the Paperclip button.

If the entry doesn't exist yet (create mode, no content typed), the composer must create the entry first before allowing attachments.

---

## 5. Toolbar Button (Entry Composer)

### Placement

New `Paperclip` icon button in the entry composer header, positioned between the SmilePlus (emotion) button and the `headerRight` slot. Same styling: `Button variant="ghost" size="sm" isIconOnly`, icon size 16.

The actual component order in the header-right area is: Check → MapPin → SmilePlus → **Paperclip (new)** → headerRight → overflow menu.

### Behavior

Pressing opens a HeroUI `Menu` popover (same pattern as journal-select and overflow menu) with three items:

| Icon | Label | Action |
|------|-------|--------|
| `Image` | Images | `pickImages()` |
| `AudioLines` | Audio | `pickAudio()` |
| `FileText` | Documents | `pickDocuments()` |

If the entry doesn't exist yet (no `currentEntryId`), create it first (same as the existing pattern where the entry is created on first content change), then proceed with the pick.

### Attachment Count Indicator

The Paperclip button uses `accent` color when `attachments.length > 0` (same pattern as the SmilePlus emotion button using `defaultEmotions.length > 0`), `muted` when none.

---

## 6. Entry View — Attachment Display

### `src/components/attachment-list.tsx`

Rendered in `entry/[id]/index.tsx` between `EntryMetaCard` and the entry body text.

**Layout:** Vertical list of attachment cards with `gap-3` between them.

Each card is a horizontal row:
- **Left:** Type icon (`Image`, `AudioLines`, or `FileText` from lucide) at size 20, color muted
- **Center:** fileName (text-sm, text-foreground) and formatted sizeBytes below (text-xs, text-muted)
- **Right:** Overflow menu button (EllipsisVertical, size 16)

**Card styling:** `flex-row items-center gap-3 p-3 rounded-xl bg-surface border border-border`

**Overflow menu items per card:**

| Icon | Label | Action |
|------|-------|--------|
| `Share` | Share | `expo-sharing` `shareAsync(uri)` — presents the system share sheet on both platforms |
| `Trash2` | Delete | Confirm dialog, then `deleteAttachment(db, id)` + refresh |

Note: "Save to device" is omitted because `expo-sharing` `shareAsync` presents the system share sheet which includes "Save to Files" on iOS and equivalent options on Android. A separate "Save" action would be redundant.

### Empty State

No empty state — if no attachments, the component renders nothing (returns `null`).

### Overline Header

When attachments exist, show `<Overline>ATTACHMENTS</Overline>` above the list with `mb-3` spacing, consistent with the section label pattern in settings and emotion check-in.

---

## 7. Utility: Format File Size

### `src/utils/format-file-size.ts`

Simple formatter: bytes → human-readable string (e.g., "2.4 MB", "128 KB"). Used in attachment cards.

---

## 8. Error Handling

- Picker cancellation: silent no-op.
- File copy failure: catch in `addAttachment`, do not insert DB row, show `Alert.alert` with message.
- DB insert failure after successful copy: delete the copied file (rollback), show alert.
- Disk full: catch `expo-file-system` errors, surface as `StorageFullError`.
- Share failure: catch, show alert.
- Delete failure: catch, show alert, do not remove from local state.

---

## 9. Scope Exclusions

- No image thumbnails or previews in this iteration — just file metadata cards.
- No audio playback from the card.
- No drag-to-reorder attachments.
- No attachment editing (rename, etc.).
- No attachment size limits enforced in app (rely on OS picker limits).
- No file deduplication.
