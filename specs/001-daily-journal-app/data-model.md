# Data Model: Daily Journal App

**Branch**: `001-daily-journal-app` | **Date**: 2026-03-20

## Entity Relationship Diagram

```
User (1) ──── (N) Journal (1) ──── (N) Entry (1) ──── (N) EmotionRecord
                                        │
                                        ├──── (N) Attachment
                                        │
                                        └──── (0..1) Location

User (1) ──── (0..1) Reminder
User (1) ──── (0..1) UserSettings
```

## Entities

### User

Represents an app user. Guests have no remote ID; authenticated users
have a Supabase auth ID.

| Field        | Type      | Constraints                        |
|--------------|-----------|------------------------------------|
| id           | text      | PK, UUID generated locally         |
| supabaseId   | text      | Nullable, unique. Set on sign-up   |
| email        | text      | Nullable. Set on sign-up           |
| displayName  | text      | Nullable                           |
| isGuest      | integer   | Boolean, default 1                 |
| createdAt    | integer   | Timestamp, not null                |
| updatedAt    | integer   | Timestamp, not null                |

**Identity rule**: Local `id` is the primary key used across all
relations. `supabaseId` is populated on authentication and used for
sync mapping.

**State transitions**:
- Guest → Authenticated: `isGuest` flips to 0, `supabaseId` and
  `email` are populated, all local data is uploaded to Supabase.

### Journal

A named notebook containing entries.

| Field        | Type      | Constraints                        |
|--------------|-----------|------------------------------------|
| id           | text      | PK, UUID                           |
| userId       | text      | FK → User.id, not null             |
| name         | text      | Not null, max 100 chars            |
| displayOrder | integer   | Not null, default 0                |
| createdAt    | integer   | Timestamp, not null                |
| updatedAt    | integer   | Timestamp, not null                |

**Indexes**:
- `journal_user_idx` on (userId)
- `journal_user_order_idx` on (userId, displayOrder)

**Uniqueness**: (userId, name) should be unique — no duplicate journal
names per user.

**Lifecycle**: Deleting a journal cascades to all its entries,
emotion records, attachments, and locations.

### Entry

A single journal entry with rich text content stored as HTML.

| Field        | Type      | Constraints                        |
|--------------|-----------|------------------------------------|
| id           | text      | PK, UUID                           |
| journalId    | text      | FK → Journal.id, not null          |
| contentHtml  | text      | Not null, default empty string     |
| contentText  | text      | Not null, default empty string     |
| createdAt    | integer   | Timestamp, not null                |
| updatedAt    | integer   | Timestamp, not null                |

**Fields explained**:
- `contentHtml`: The rich text content as HTML (from react-native-enriched)
- `contentText`: Plain text extraction of content, used for FTS5
  indexing and Markdown export

**Indexes**:
- `entry_journal_idx` on (journalId)
- `entry_journal_created_idx` on (journalId, createdAt)
- `entry_created_idx` on (createdAt)

**FTS5 virtual table** (created via raw SQL):
```sql
CREATE VIRTUAL TABLE IF NOT EXISTS entry_fts
  USING fts5(contentText, content=entry, content_rowid=rowid);
```
Kept in sync via INSERT/UPDATE/DELETE triggers.

### EmotionRecord

An emotion selection attached to an entry. One row per selected
emotion (an entry with 3 emotions has 3 EmotionRecord rows).

| Field        | Type      | Constraints                        |
|--------------|-----------|------------------------------------|
| id           | text      | PK, UUID                           |
| entryId      | text      | FK → Entry.id, not null            |
| category     | text      | Not null, one of predefined values |
| intensity    | integer   | Not null, range 1-5                |
| createdAt    | integer   | Timestamp, not null                |

**Predefined categories** (v1 fixed set):
`happy`, `sad`, `anxious`, `calm`, `frustrated`, `excited`,
`grateful`, `angry`, `hopeful`, `tired`

**Indexes**:
- `emotion_entry_idx` on (entryId)
- `emotion_category_idx` on (category)
- `emotion_entry_intensity_idx` on (entryId, intensity DESC)

**Validation**: `intensity` must be between 1 and 5 inclusive.
`category` must be one of the predefined values.

### Attachment

A media artifact linked to an entry.

| Field        | Type      | Constraints                        |
|--------------|-----------|------------------------------------|
| id           | text      | PK, UUID                           |
| entryId      | text      | FK → Entry.id, not null            |
| type         | text      | Not null: 'photo', 'voice_memo', 'file', 'link' |
| uri          | text      | Not null, local file path or URL   |
| mimeType     | text      | Nullable                           |
| fileName     | text      | Nullable                           |
| sizeBytes    | integer   | Nullable                           |
| displayOrder | integer   | Not null, default 0                |
| createdAt    | integer   | Timestamp, not null                |

**Note**: Inline photos in the editor are stored as part of
`contentHtml`. This table tracks photos as standalone attachments
and non-inline media (voice memos, files, links).

**Indexes**:
- `attachment_entry_idx` on (entryId)

### Location

An optional location tag on an entry.

| Field        | Type      | Constraints                        |
|--------------|-----------|------------------------------------|
| id           | text      | PK, UUID                           |
| entryId      | text      | FK → Entry.id, unique, not null    |
| name         | text      | Not null (user-entered or reverse-geocoded) |
| latitude     | real      | Nullable (null if manually entered)|
| longitude    | real      | Nullable (null if manually entered)|
| createdAt    | integer   | Timestamp, not null                |

**Cardinality**: One location per entry (1:1). The unique constraint
on `entryId` enforces this.

**Indexes**:
- `location_entry_idx` on (entryId) — unique

### Reminder

User's daily notification preference.

| Field        | Type      | Constraints                        |
|--------------|-----------|------------------------------------|
| id           | text      | PK, UUID                           |
| userId       | text      | FK → User.id, unique, not null     |
| isEnabled    | integer   | Boolean, default 0                 |
| hour         | integer   | Not null, 0-23                     |
| minute       | integer   | Not null, 0-59                     |
| updatedAt    | integer   | Timestamp, not null                |

**Cardinality**: One reminder config per user (1:1).

**Indexes**:
- `reminder_user_idx` on (userId) — unique

### UserSettings

App-level preferences.

| Field              | Type      | Constraints                   |
|--------------------|-----------|-------------------------------|
| id                 | text      | PK, UUID                      |
| userId             | text      | FK → User.id, unique, not null|
| hasCompletedOnboarding | integer | Boolean, default 0        |
| lastActiveJournalId | text     | FK → Journal.id, nullable     |
| updatedAt          | integer   | Timestamp, not null           |

**Indexes**:
- `settings_user_idx` on (userId) — unique

## Cascade Rules

| Parent   | Child          | On Delete  |
|----------|----------------|------------|
| User     | Journal        | CASCADE    |
| User     | Reminder       | CASCADE    |
| User     | UserSettings   | CASCADE    |
| Journal  | Entry          | CASCADE    |
| Entry    | EmotionRecord  | CASCADE    |
| Entry    | Attachment     | CASCADE    |
| Entry    | Location       | CASCADE    |

## Derived Queries

### Dominant Mood for a Day

Used by calendar color-coding. For a given day:
1. Get the most recent entry for that day
2. Get the emotion with the highest intensity on that entry
3. That emotion's category determines the color

```sql
SELECT er.category, er.intensity
FROM emotion_record er
JOIN entry e ON er.entryId = e.id
WHERE e.journalId = ? AND date(e.createdAt, 'unixepoch') = ?
ORDER BY e.createdAt DESC, er.intensity DESC
LIMIT 1;
```

### Mood Trends (Insights)

Aggregate emotion data over a time range:
```sql
SELECT er.category, AVG(er.intensity) as avgIntensity,
       COUNT(*) as frequency
FROM emotion_record er
JOIN entry e ON er.entryId = e.id
WHERE e.createdAt BETWEEN ? AND ?
GROUP BY er.category
ORDER BY frequency DESC;
```

### Journaling Streak

Count consecutive days with entries:
```sql
WITH RECURSIVE dates AS (
  SELECT date('now') as d
  UNION ALL
  SELECT date(d, '-1 day') FROM dates
  WHERE EXISTS (
    SELECT 1 FROM entry
    WHERE date(createdAt, 'unixepoch') = date(d, '-1 day')
  )
)
SELECT COUNT(*) - 1 as streak FROM dates;
```

### Full-Text Search

```sql
SELECT e.* FROM entry e
JOIN entry_fts ON entry_fts.rowid = e.rowid
WHERE entry_fts MATCH ?
  AND e.journalId = ?
ORDER BY rank;
```
