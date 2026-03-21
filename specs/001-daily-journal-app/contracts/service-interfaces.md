# Service Interface Contracts

**Branch**: `001-daily-journal-app` | **Date**: 2026-03-20

This app is a mobile application with no public API. These contracts
define the internal service layer boundaries that components depend
on. Each service is an interface that can be tested independently.

## JournalService

Manages journal CRUD and ordering.

```typescript
interface JournalService {
  create(params: { name: string }): Promise<Journal>;
  getAll(): Promise<readonly Journal[]>;
  getById(id: string): Promise<Journal | undefined>;
  rename(id: string, name: string): Promise<void>;
  reorder(orderedIds: readonly string[]): Promise<void>;
  delete(id: string): Promise<void>;
}
```

## EntryService

Manages entry CRUD, auto-save, and content.

```typescript
interface EntryService {
  create(params: { journalId: string }): Promise<Entry>;
  getById(id: string): Promise<Entry | undefined>;
  getByJournal(journalId: string, params?: {
    readonly limit?: number;
    readonly offset?: number;
  }): Promise<readonly Entry[]>;
  getByDate(journalId: string, date: string): Promise<readonly Entry[]>;
  updateContent(id: string, params: {
    readonly contentHtml: string;
    readonly contentText: string;
  }): Promise<void>;
  delete(id: string): Promise<void>;
  search(journalId: string, query: string): Promise<readonly Entry[]>;
  filterByEmotion(journalId: string, category: EmotionCategory): Promise<readonly Entry[]>;
  filterByDateRange(journalId: string, params: {
    readonly start: Date;
    readonly end: Date;
  }): Promise<readonly Entry[]>;
}
```

## EmotionService

Manages emotion check-in data on entries.

```typescript
type EmotionCategory =
  | 'happy' | 'sad' | 'anxious' | 'calm' | 'frustrated'
  | 'excited' | 'grateful' | 'angry' | 'hopeful' | 'tired';

interface EmotionInput {
  readonly category: EmotionCategory;
  readonly intensity: 1 | 2 | 3 | 4 | 5;
}

interface EmotionService {
  setEmotions(entryId: string, emotions: readonly EmotionInput[]): Promise<void>;
  getByEntry(entryId: string): Promise<readonly EmotionRecord[]>;
  getDominantMoodForDay(date: string): Promise<EmotionRecord | undefined>;
  getMoodTrends(params: {
    readonly start: Date;
    readonly end: Date;
  }): Promise<readonly MoodTrend[]>;
  getMostFrequentEmotions(params: {
    readonly start: Date;
    readonly end: Date;
    readonly limit: number;
  }): Promise<readonly EmotionFrequency[]>;
}
```

## InsightsService

Computes aggregated insights from emotion and entry data.

```typescript
interface InsightsService {
  getStreak(): Promise<StreakData>;
  getMoodHeatmap(params: {
    readonly month: number;
    readonly year: number;
  }): Promise<readonly DayMood[]>;
  getMoodTrendsChart(params: {
    readonly range: 'week' | 'month' | '3months' | 'year';
  }): Promise<readonly MoodDataPoint[]>;
  getTopEmotions(params: {
    readonly range: 'week' | 'month' | '3months' | 'year';
    readonly limit: number;
  }): Promise<readonly EmotionRanking[]>;
}

interface StreakData {
  readonly currentStreak: number;
  readonly longestStreak: number;
  readonly totalEntries: number;
  readonly encouragingMessage: string;
}

interface DayMood {
  readonly date: string;
  readonly dominantEmotion: EmotionCategory | undefined;
  readonly intensity: number | undefined;
  readonly hasEntry: boolean;
}
```

## AttachmentService

Manages file attachments on entries.

```typescript
type AttachmentType = 'photo' | 'voice_memo' | 'file' | 'link';

interface AttachmentService {
  addPhoto(entryId: string, uri: string): Promise<Attachment>;
  addVoiceMemo(entryId: string, uri: string): Promise<Attachment>;
  addFile(entryId: string, uri: string, fileName: string): Promise<Attachment>;
  addLink(entryId: string, url: string): Promise<Attachment>;
  getByEntry(entryId: string): Promise<readonly Attachment[]>;
  delete(id: string): Promise<void>;
}
```

## LocationService

Manages location tagging on entries.

```typescript
interface LocationService {
  setManual(entryId: string, name: string): Promise<Location>;
  setFromDevice(entryId: string): Promise<Location>;
  getByEntry(entryId: string): Promise<Location | undefined>;
  remove(entryId: string): Promise<void>;
}
```

## AuthService

Manages authentication state and guest-to-account migration.

```typescript
type AuthState =
  | { readonly status: 'guest' }
  | { readonly status: 'authenticated'; readonly userId: string; readonly email: string }
  | { readonly status: 'loading' };

interface AuthService {
  getState(): AuthState;
  signUpWithEmail(params: {
    readonly email: string;
    readonly password: string;
  }): Promise<void>;
  signIn(params: {
    readonly email: string;
    readonly password: string;
  }): Promise<void>;
  signOut(): Promise<void>;
  deleteAccount(): Promise<void>;
  migrateGuestData(): Promise<void>;
}
```

## ExportService

Handles entry and journal export.

```typescript
type ExportFormat = 'pdf' | 'markdown' | 'json';

interface ExportService {
  exportEntry(entryId: string, format: ExportFormat): Promise<string>;
  exportJournal(journalId: string, format: ExportFormat): Promise<string>;
  exportInsightAsImage(viewRef: unknown): Promise<string>;
  exportInsightAsPdf(viewRef: unknown): Promise<string>;
}
```

## ReminderService

Manages daily notification scheduling.

```typescript
interface ReminderService {
  getConfig(): Promise<ReminderConfig>;
  setReminder(params: {
    readonly hour: number;
    readonly minute: number;
  }): Promise<void>;
  disable(): Promise<void>;
  getNotificationContent(params: {
    readonly daysSinceLastEntry: number;
  }): NotificationContent;
}
```

## TranscriptionService

Manages voice-to-text dictation via whisper.rn.

```typescript
type TranscriptionStatus = 'idle' | 'loading_model' | 'recording' | 'error';

interface TranscriptionService {
  initialize(): Promise<void>;
  start(callbacks: {
    readonly onTranscribe: (text: string) => void;
    readonly onStatusChange: (status: TranscriptionStatus) => void;
    readonly onError: (error: Error) => void;
  }): Promise<void>;
  stop(): Promise<string>;
  isModelDownloaded(): Promise<boolean>;
  downloadModel(onProgress: (progress: number) => void): Promise<void>;
}
```
