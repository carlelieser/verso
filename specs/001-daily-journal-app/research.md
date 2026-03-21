# Research: Daily Journal App

**Branch**: `001-daily-journal-app` | **Date**: 2026-03-20

## Rich Text Editor — react-native-enriched

**Decision**: Use `react-native-enriched` v0.5.2 by Software Mansion.

**Rationale**: User-specified technology. It provides inline bold/italic/underline/strikethrough, headings (H1-H6), blockquotes, ordered/unordered/checkbox lists, code blocks, and inline image embedding via `setImage()`. Content is output as HTML strings via `onChangeHtml`. Requires Expo dev client (no Expo Go) and React Native New Architecture (Fabric).

**Alternatives considered**:
- `react-native-pell-rich-editor` — older, not Fabric-compatible
- `@10play/tentap-editor` — ProseMirror-based, heavier

**Key limitations**:
- No divider/horizontal rule support — must implement as a custom styled `<View>` separator between blocks
- No nested lists (single level only)
- `onChangeHtml` is expensive on iOS — must debounce (500ms+) for auto-save
- HTML-only output — Markdown export requires HTML-to-Markdown conversion at export time
- Requires Fabric (New Architecture) exclusively

## Voice Dictation — whisper.rn

**Decision**: Use `whisper.rn` v0.5.5 by mybigday with Silero VAD for real-time transcription.

**Rationale**: User-specified technology. Runs Whisper inference locally on-device — no cloud API, no network dependency, aligns with privacy-first principle. Uses slice-based transcription with VAD for auto-slicing on speech pauses.

**Alternatives considered**:
- Platform speech-to-text APIs (iOS Speech, Android SpeechRecognizer) — less control, inconsistent cross-platform
- Cloud APIs (Deepgram, AssemblyAI) — requires network, privacy concerns

**Key decisions**:
- **Model**: `ggml-tiny.en.bin` (~75MB) for v1 — best mobile performance. Download at first use, not bundled in app binary (keeps install size small).
- **Architecture**: `RealtimeTranscriber` class with `@fugood/react-native-audio-pcm-stream` for mic capture
- **VAD**: Silero VAD v6.2.0 for automatic speech-end detection and slice boundaries
- **Core ML**: Enable on iOS 15+ for hardware acceleration

**Key limitations**:
- Slice-based, not word-level streaming — transcription arrives per-slice, not per-word
- English-only for v1 (using `.en` model variant for speed)
- Requires Expo dev client (native C++ module)
- ~273MB RAM usage during transcription

## UI Components — HeroUI Native

**Decision**: Use `heroui-native` v1.0.0-rc.1 as the primary component library, supplemented by specialized libraries for calendar and charts.

**Rationale**: User-specified technology. Provides buttons, inputs, sliders, cards, bottom sheets, dialogs, switches, tabs, and more. Tailwind-based theming via Uniwind with automatic dark mode support.

**Alternatives considered**:
- React Native Paper — more components but Material Design-locked
- Tamagui — more mature but different styling paradigm

**Supplementary libraries needed**:
- `react-native-calendars` — calendar view with day marking and color-coding (HeroUI has no calendar)
- `react-native-gifted-charts` v1.4.70 — mood trend line/bar/pie charts (HeroUI has no charts)
- Custom mood heatmap component using `react-native-svg`

**Key peer dependencies**: react-native-reanimated, react-native-gesture-handler, react-native-worklets, react-native-svg, @gorhom/bottom-sheet

## Local Database — Drizzle ORM + expo-sqlite

**Decision**: Use `drizzle-orm` ~0.44.x with `expo-sqlite` ~15.x. Enable SQLCipher for encryption at rest.

**Rationale**: User-specified technology. Type-safe schema definitions, relational query API (no N+1), migration support via `useMigrations` hook.

**Alternatives considered**:
- WatermelonDB — good for sync but adds complexity
- TypeORM — heavier, less SQLite-focused

**Key decisions**:
- **Encryption**: SQLCipher via `expo-sqlite` config plugin. Key stored in `expo-secure-store`.
- **FTS5**: Raw SQL for `CREATE VIRTUAL TABLE` (Drizzle doesn't support virtual tables natively). Triggers keep FTS index in sync.
- **Performance**: WAL mode, NORMAL synchronous, 8MB cache, prepared statements by default.
- **Migrations**: Generated with `drizzle-kit generate`, bundled via `babel-plugin-inline-import`, run at app startup.

**Key limitations**:
- FTS5 virtual tables require raw SQL outside Drizzle schema
- SQLCipher requires dev client (no Expo Go)

## Authentication — Supabase Auth

**Decision**: Use `@supabase/supabase-js` v2.x for email authentication.

**Rationale**: Simplest integration with Expo (works in Expo Go), pairs naturally with PowerSync for sync, supports email/password sign-up. Guest mode is implemented by skipping auth entirely and storing data locally.

**Alternatives considered**:
- Firebase Auth — requires dev client, Google Cloud coupling
- Custom backend — unnecessary engineering effort

**Key decisions**:
- Guest-to-account migration: on sign-up, upload all local SQLite data to Supabase Postgres, then enable sync
- Row Level Security (RLS) on Supabase ensures data privacy at the database level

## Cross-Device Sync — PowerSync

**Decision**: Use `@powersync/react-native` v1.29.x with `@powersync/drizzle-driver` for SQLite sync.

**Rationale**: Only production-ready offline-first SQLite sync for React Native. Reads/writes happen locally, PowerSync handles upload queue and incoming change streams. Offline operation is seamless.

**Alternatives considered**:
- Supabase Realtime + manual sync — requires building own conflict resolution and queue management
- Firebase + manual sync — database model mismatch (document vs relational)

**Key decisions**:
- Sync only for authenticated users — guest mode is purely local
- Last-write-wins conflict resolution (aligns with spec assumption)
- PowerSync Cloud free tier for v1

## Push Notifications — expo-notifications

**Decision**: Use `expo-notifications` (bundled with Expo SDK) for local daily reminders.

**Rationale**: Built into Expo, supports `DailyTriggerInput` for recurring notifications at a specific time. No push server needed.

**Key decisions**:
- Local notifications only — no remote push infrastructure for v1
- Android 12+: declare `SCHEDULE_EXACT_ALARM` permission in app.json

## PDF/Image Export — expo-print

**Decision**: Use `expo-print` + `expo-sharing` for PDF generation and `react-native-view-shot` for insight image export.

**Rationale**: Built into Expo SDK, generates PDFs from HTML strings. Entry content is already HTML (from react-native-enriched), so conversion is straightforward.

**Key decisions**:
- Embed photos as base64 in HTML template before PDF generation
- Use `expo-image-manipulator` to resize photos before base64 encoding
- Insight image export: capture the chart/heatmap view as an image using `react-native-view-shot`

## Markdown/JSON Export

**Decision**: Custom conversion at export time. HTML → Markdown using a lightweight converter. JSON export serializes entries with metadata.

**Rationale**: No library needed — HTML-to-Markdown conversion is straightforward for the limited formatting set (headings, bold, italic, lists, quotes).

**Key decisions**:
- Markdown export: one `.md` file per entry with YAML frontmatter (date, emotions, location)
- JSON export: single `.json` file with array of entry objects including all metadata
- Journal export: ZIP archive containing all entry files
