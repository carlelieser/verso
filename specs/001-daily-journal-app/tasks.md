# Tasks: Daily Journal App

**Input**: Design documents from `/specs/001-daily-journal-app/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/service-interfaces.md, ui-architecture.md

**Tests**: Tests are included per the constitution's Testing Standards principle (tests before or alongside implementation).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Project initialization, tooling, and dependency installation

- [x] T001 Initialize Expo project with `npx create-expo-app verso --template tabs` and configure for Expo SDK 54+ with New Architecture (Fabric) enabled
- [x] T002 Install all dependencies per quickstart.md — heroui-native, react-native-enriched, whisper.rn, drizzle-orm, expo-sqlite, supabase-js, powersync, react-native-calendars, react-native-gifted-charts, react-native-view-shot, expo-notifications, expo-print, expo-sharing, expo-image-picker, expo-location, expo-secure-store, expo-av, expo-file-system, expo-document-picker, expo-image-manipulator, react-native-fs, @fugood/react-native-audio-pcm-stream
- [x] T003 [P] Configure tsconfig.json with `strict: true`, `noUncheckedIndexedAccess: true`, and path aliases (`@/*` → `src/*`)
- [x] T004 [P] Configure ESLint with `@typescript-eslint/no-explicit-any`, `@typescript-eslint/explicit-module-boundary-types`, and import ordering rules
- [x] T005 [P] Configure Prettier with shared config in `.prettierrc`
- [x] T006 [P] Configure app.json with SQLCipher plugin, notification permissions, iOS Info.plist entries (microphone, location, photo library), Android permissions (RECORD_AUDIO, ACCESS_FINE_LOCATION, SCHEDULE_EXACT_ALARM, READ_MEDIA_IMAGES)
- [x] T007 [P] Configure metro.config.js with Uniwind (`withUniwindConfig`), `sql` in sourceExts, `bin`/`mil` in assetExts
- [x] T008 [P] Configure babel.config.js with `babel-plugin-inline-import`
- [x] T009 [P] Configure drizzle.config.ts with `dialect: sqlite`, `driver: expo`, schema path `./src/db/schema.ts`, output `./drizzle`
- [x] T010 [P] Configure global.css with HeroUI Native theme overrides matching design tokens from ui-architecture.md (background `#1A1A1C`, accent `#C9A962`, card `#242426`, text `#F5F5F0`/`#6E6E70`/`#4A4A4C`)
- [x] T011 [P] Create `.env` with EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_POWERSYNC_URL placeholders
- [x] T012 Generate development build with `npx expo prebuild` and verify it launches on Android device

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can begin

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T013 [P] Define all TypeScript types in src/types/journal.ts, src/types/entry.ts, src/types/emotion.ts, src/types/attachment.ts, src/types/common.ts — matching entities from data-model.md and discriminated unions from contracts (AuthState, TranscriptionStatus, ExportFormat, AttachmentType, EmotionCategory)
- [x] T014 [P] Define emotion constants in src/constants/emotions.ts — categories array, emoji map, color map (matching design: gold for selected, `#242426` for unselected), intensity labels
- [x] T015 [P] Define theme constants in src/constants/theme.ts — all design tokens from ui-architecture.md (colors, typography, spacing, radii)
- [x] T016 [P] Define domain error classes in src/errors/domain-errors.ts — JournalNotFoundError, EntryNotFoundError, ExportError, TranscriptionError, StorageFullError, all extending Error with `{ cause }` wrapping
- [x] T017 Define Drizzle schema in src/db/schema.ts — all 7 tables (users, journals, entries, emotionRecords, attachments, locations, reminders, userSettings) with columns, indexes, foreign keys, and cascade rules per data-model.md
- [x] T018 Define Drizzle relations in src/db/relations.ts — usersRelations, journalsRelations, entriesRelations per data-model.md ERD
- [x] T019 Implement DB client initialization in src/db/client.ts — open SQLCipher-encrypted database, set WAL mode, NORMAL synchronous, 8MB cache, store encryption key in expo-secure-store, initialize Drizzle ORM instance
- [x] T020 Implement FTS5 setup in src/db/fts.ts — create entry_fts virtual table via raw SQL, create INSERT/UPDATE/DELETE triggers to keep index in sync
- [x] T021 Implement migration runner in src/db/migrations.ts — use `useMigrations` hook pattern from drizzle-orm/expo-sqlite/migrator
- [x] T022 Run `npx drizzle-kit generate` to create initial migration from schema
- [x] T023 [P] Implement DatabaseProvider in src/providers/database-provider.tsx — wraps app with DB context, runs migrations on mount, exposes Drizzle db instance, shows migration loading/error states
- [x] T024 [P] Implement common UI components: src/components/common/empty-state.tsx (icon + title + description + optional CTA), src/components/common/loading-state.tsx (spinner), src/components/common/error-boundary.tsx (error boundary with fallback UI)
- [x] T025 Implement root layout in src/app/_layout.tsx — wrap app with GestureHandlerRootView, HeroUINativeProvider, DatabaseProvider, Expo Router Stack navigator
- [x] T026 [P] Implement date utility functions in src/utils/date.ts — formatDate, formatTime, isToday, getDateString, getDaysDifference, getStreakDays
- [x] T027 [P] Implement image utility functions in src/utils/image.ts — compressImage (via expo-image-manipulator), imageToBase64, pickImage (via expo-image-picker)

**Checkpoint**: Foundation ready — database initializes, migrations run, app launches with providers, type system is complete

---

## Phase 3: User Story 1 — Write a Journal Entry (Priority: P1)

**Goal**: Users can create journals, write rich text entries with inline photos and voice dictation, and have entries auto-saved

**Independent Test**: Create a journal, write an entry with formatting and an embedded photo, use dictation, close and reopen to verify persistence

### Implementation for User Story 1

- [x] T028 [P] [US1] Implement JournalService in src/services/journal-service.ts — create, getAll, getById, rename, reorder, delete per JournalService contract
- [x] T029 [P] [US1] Implement EntryService in src/services/entry-service.ts — create, getById, getByJournal (paginated), updateContent, delete per EntryService contract (search/filter methods stubbed for US4)
- [x] T030 [P] [US1] Implement AttachmentService in src/services/attachment-service.ts — addPhoto, addVoiceMemo, addFile, addLink, getByEntry, delete per AttachmentService contract
- [x] T031 [P] [US1] Implement TranscriptionService in src/services/transcription-service.ts — initialize whisper.rn context with ggml-tiny.en model, downloadModel with progress callback, start/stop RealtimeTranscriber with Silero VAD, handle onTranscribe/onError/onStatusChange callbacks
- [x] T032 [US1] Implement useJournals hook in src/hooks/use-journals.ts — wraps JournalService with React state, loading/error handling, optimistic updates for reorder
- [x] T033 [US1] Implement useEntries hook in src/hooks/use-entries.ts — wraps EntryService with pagination, loading states
- [x] T034 [US1] Implement useAutoSave hook in src/hooks/use-auto-save.ts — debounced (500ms) save of contentHtml/contentText to EntryService.updateContent, tracks dirty state
- [x] T035 [US1] Implement useTranscription hook in src/hooks/use-transcription.ts — wraps TranscriptionService, manages model download state, recording state, appends transcribed text to editor
- [x] T036 [US1] Implement JournalList component in src/components/journals/journal-list.tsx — renders journal cards in vertical list, "New Journal" button, empty state for no journals
- [x] T037 [US1] Implement JournalCard component in src/components/journals/journal-card.tsx — journal name, entry count, last entry date
- [x] T038 [US1] Implement CreateJournalSheet component in src/components/journals/create-journal-sheet.tsx — bottom sheet with name input and create button using @gorhom/bottom-sheet
- [x] T039 [US1] Implement Editor component in src/components/editor/editor.tsx — wrap react-native-enriched with ref for imperative API, wire onChangeHtml to useAutoSave (debounced), extract contentText for FTS, handle setImage for inline photos
- [x] T040 [US1] Implement Toolbar component in src/components/editor/toolbar.tsx — formatting buttons (bold, italic, heading, list, quote) calling editor ref methods (toggleBold, etc.), image picker button, pill-shaped dark bar matching design
- [x] T041 [US1] Implement DictationButton component in src/components/editor/dictation-button.tsx — gold mic button, shows recording state, triggers useTranscription start/stop, appends transcribed text at cursor position
- [x] T042 [US1] Implement Home screen in src/app/(tabs)/index.tsx — header with greeting + date + notification icon, "RECENT ENTRIES" section label, entry card feed (FlatList), FAB button for new entry
- [x] T043 [US1] Implement Entry Card component (inline in home or shared) — date, mood pill, title (Cormorant 18px), preview text (2 lines), word count, matching design from ui-architecture.md
- [x] T044 [US1] Implement Journal timeline screen in src/app/journal/[id].tsx — header with journal name, entry list (FlatList with pagination), new entry button
- [x] T045 [US1] Implement Entry editor screen in src/app/entry/[id].tsx — nav header (close, journal name, undo, more), date + mood pill, title field, Editor component, Toolbar (absolute bottom with gradient fade)
- [x] T046 [US1] Implement Journal Entry read view — reuse src/app/entry/[id].tsx with read-only mode toggle, showing formatted content, tags, photos, edit button, share icon
- [x] T047 [US1] Implement tab navigator in src/app/(tabs)/_layout.tsx — pill-style tab bar with 5 tabs (Home, Calendar, Write, Insights, Profile) matching design, gold active state, gradient fade above

### Tests for User Story 1

- [ ] T048 [P] [US1] Unit test JournalService in tests/unit/services/journal-service.test.ts — create, getAll, rename, reorder, delete with fresh DB per test
- [ ] T049 [P] [US1] Unit test EntryService in tests/unit/services/entry-service.test.ts — create, getByJournal (pagination), updateContent, delete
- [ ] T050 [P] [US1] Integration test DB operations in tests/integration/db/entry-persistence.test.ts — write entry with HTML content, close DB, reopen, verify content preserved

**Checkpoint**: User Story 1 is fully functional — users can create journals, write entries with rich formatting, dictate via whisper, embed photos, and auto-save

---

## Phase 4: User Story 2 — Track Emotions on an Entry (Priority: P2)

**Goal**: Users can select multiple emotions with intensity sliders and attach them to entries

**Independent Test**: Write an entry, complete emotion check-in with 3 emotions at different intensities, save, reopen, verify emotion data persists

### Implementation for User Story 2

- [x] T051 [P] [US2] Implement EmotionService in src/services/emotion-service.ts — setEmotions (replace all for entry), getByEntry, getDominantMoodForDay per EmotionService contract
- [x] T052 [US2] Implement useEmotions hook in src/hooks/use-emotions.ts — wraps EmotionService, manages selected emotions state with intensity values
- [x] T053 [US2] Implement EmotionWheel component in src/components/emotions/emotion-wheel.tsx — 2x5 grid of emotion chips (emoji + label), selected state (gold fill) vs unselected (dark card with border), multi-select
- [x] T054 [US2] Implement IntensitySlider component in src/components/emotions/intensity-slider.tsx — emoji + label + value + gold slider track with thumb (1-5 scale), using HeroUI Slider or custom implementation
- [x] T055 [US2] Implement Emotion Check-in screen in src/app/entry/emotions.tsx — header "How are you feeling?" + Skip, subtitle, EmotionWheel, intensity sliders for selected emotions, "Save Emotions" gold CTA button
- [x] T056 [US2] Update Entry editor (src/app/entry/[id].tsx) — mood pill shows selected emotions or "Add Mood" tappable link that navigates to emotion check-in, display emotion pills on entry view
- [ ] T057 [US2] Update Entry Card component — show dominant mood pill (emoji + label) on cards in feed and calendar

### Tests for User Story 2

- [ ] T058 [P] [US2] Unit test EmotionService in tests/unit/services/emotion-service.test.ts — setEmotions, getByEntry, getDominantMoodForDay with multiple entries per day
- [ ] T059 [P] [US2] Component test EmotionWheel in tests/component/components/emotion-wheel.test.tsx — multi-select, deselect, visual state changes

**Checkpoint**: Emotion tracking fully functional — select multiple emotions with intensities, data persists on entries, mood pills visible on cards

---

## Phase 5: User Story 3 — Browse Entries on a Calendar (Priority: P3)

**Goal**: Calendar view shows journaling activity with mood-colored days, tap to navigate to entries

**Independent Test**: Create entries across multiple days with different emotions, open calendar, verify day highlights and mood colors, tap days to open entries

### Implementation for User Story 3

- [x] T060 [US3] Extend EmotionService — implement getMoodTrends, getMostFrequentEmotions methods (needed for calendar mood colors)
- [x] T061 [US3] Implement MoodCalendar component in src/components/calendar/mood-calendar.tsx — wrap react-native-calendars with custom day marking, mood-colored dots per day, gold highlight for today, tap handler
- [x] T062 [US3] Implement DayCell component in src/components/calendar/day-cell.tsx — custom day rendering with mood color dot (mapped from emotion category to color via constants)
- [x] T063 [US3] Implement Calendar screen in src/app/(tabs)/calendar.tsx — month navigation header (← March 2026 →), weekday headers, MoodCalendar grid, selected day entry cards section below

### Tests for User Story 3

- [ ] T064 [P] [US3] Unit test dominant mood calculation in tests/unit/services/emotion-service-calendar.test.ts — verify correct mood returned for days with multiple entries

**Checkpoint**: Calendar view functional — days highlighted, mood colors accurate, tap navigation works

---

## Phase 6: User Story 4 — View Emotional Insights (Priority: P4)

**Goal**: Visual insights dashboard with mood trends, streak counters, emotion frequency, and exportable charts

**Independent Test**: Create entries with varied emotions over simulated time, open insights, verify charts render, export as image/PDF

### Implementation for User Story 4

- [x] T065 [P] [US4] Implement InsightsService in src/services/insights-service.ts — getStreak (recursive CTE query), getMoodHeatmap, getMoodTrendsChart, getTopEmotions per InsightsService contract
- [x] T066 [US4] Implement useInsights hook in src/hooks/use-insights.ts — wraps InsightsService, manages time range filter state (week/month/3months/year), loading states
- [x] T067 [P] [US4] Implement StreakCounter component in src/components/insights/streak-counter.tsx — two stat cards (current + longest streak) with large Cormorant numbers, encouraging message
- [x] T068 [P] [US4] Implement MoodTrendChart component in src/components/insights/mood-trend-chart.tsx — line chart using react-native-gifted-charts showing emotion intensity over time, time range filter tabs
- [x] T069 [P] [US4] Implement EmotionFrequency component in src/components/insights/emotion-frequency.tsx — ranked list of emotions with emoji + label + percentage bar (gold fill on `#2A2A2C` background)
- [x] T070 [P] [US4] Implement MoodHeatmap component in src/components/insights/mood-heatmap.tsx — calendar-style heatmap with emotion-colored cells using react-native-svg
- [x] T071 [US4] Implement Insights screen in src/app/(tabs)/insights.tsx — header "Insights" + share button, streak section, monthly stats (entries + words), mood breakdown card, average writing time card
- [ ] T072 [US4] Implement insight export — capture chart views as images via react-native-view-shot, export as PDF via expo-print, share via expo-sharing

### Tests for User Story 4

- [ ] T073 [P] [US4] Unit test InsightsService in tests/unit/services/insights-service.test.ts — streak calculation (consecutive days), mood trends aggregation, top emotions ranking

**Checkpoint**: Insights dashboard functional — streak, trends, frequency, heatmap all render with real data, export works

---

## Phase 7: User Story 5 — Manage Journals and Entries (Priority: P5)

**Goal**: Rename, reorder, delete journals; add locations and attachments to entries

**Independent Test**: Create multiple journals, rename one, reorder, delete one (verify confirmation), add location and attachment to entry

### Implementation for User Story 5

- [x] T074 [P] [US5] Implement LocationService in src/services/location-service.ts — setManual, setFromDevice (expo-location reverse geocode), getByEntry, remove per LocationService contract
- [ ] T075 [US5] Add journal management UI to home screen — long-press/swipe actions on journal cards (rename, reorder, delete), delete confirmation dialog via HeroUI Dialog
- [ ] T076 [US5] Add drag-to-reorder to JournalList using react-native-gesture-handler/react-native-reanimated
- [ ] T077 [US5] Add location tagging to Entry editor — location button in toolbar or metadata area, bottom sheet with manual text input and "Use Current Location" button
- [ ] T078 [US5] Add attachment support to Entry editor — voice memo recording (expo-av), file picker (expo-document-picker), link input, attachment list display on entry view

### Tests for User Story 5

- [ ] T079 [P] [US5] Unit test LocationService in tests/unit/services/location-service.test.ts — manual location, device location mock

**Checkpoint**: Full journal management — rename, reorder, delete with confirmation, locations and attachments on entries

---

## Phase 8: User Story 6 — Export Journal Data (Priority: P6)

**Goal**: Export entries/journals as PDF or Markdown/JSON

**Independent Test**: Create entries with formatting and photos, export as PDF and Markdown, verify content accuracy

### Implementation for User Story 6

- [x] T080 [P] [US6] Implement html-to-markdown converter in src/utils/html-to-markdown.ts — convert editor HTML to Markdown (headings, bold, italic, lists, quotes), strip inline images, generate YAML frontmatter (date, emotions, location)
- [x] T081 [US6] Implement ExportService in src/services/export-service.ts — exportEntry (PDF via expo-print with HTML template + base64 images, Markdown via converter, JSON serialization), exportJournal (ZIP archive of all entries), exportInsightAsImage/AsPdf via react-native-view-shot + expo-print
- [ ] T082 [US6] Implement Export bottom sheet UI — reuse design from ui-architecture.md (scope toggle, format radio options, export CTA), integrate with expo-sharing for share sheet
- [ ] T083 [US6] Wire export to Profile settings screen — "Export Entries" row navigates to export sheet with journal scope

### Tests for User Story 6

- [ ] T084 [P] [US6] Unit test html-to-markdown in tests/unit/utils/html-to-markdown.test.ts — headings, bold, italic, lists, quotes, image stripping, frontmatter generation

**Checkpoint**: Export functional — PDF preserves formatting/photos, Markdown generates clean files with frontmatter

---

## Phase 9: User Story 7 — Sign Up and Sync (Priority: P7)

**Goal**: Email sign-up, guest mode, cross-device sync for authenticated users

**Independent Test**: Use app as guest (verify local persistence), sign up with email, verify data migrates, verify sync to second device

### Implementation for User Story 7

- [x] T085 [P] [US7] Implement AuthService in src/services/auth-service.ts — signUpWithEmail, signIn, signOut, deleteAccount via Supabase Auth, migrateGuestData (upload local SQLite data to Supabase Postgres)
- [x] T086 [US7] Implement AuthProvider in src/providers/auth-provider.tsx — AuthState context (guest/authenticated/loading), persist auth state, auto-restore session
- [x] T087 [US7] Implement useAuth hook in src/hooks/use-auth.ts — wraps AuthService/AuthProvider, exposes signUp/signIn/signOut/deleteAccount actions
- [x] T088 [US7] Implement SyncProvider in src/providers/sync-provider.tsx — initialize PowerSync for authenticated users, configure sync rules, handle offline/online transitions
- [x] T089 [US7] Implement Welcome screen in src/app/auth/welcome.tsx — logo, feature highlights, "Create Account" CTA, "Continue as Guest" secondary, "Sign In" link per design
- [x] T090 [P] [US7] Implement Sign Up screen in src/app/auth/sign-up.tsx — email + password form with validation, Supabase signUpWithEmail, navigate to home on success
- [x] T091 [P] [US7] Implement Sign In screen in src/app/auth/sign-in.tsx — email + password form, Supabase signIn, navigate to home on success
- [ ] T092 [US7] Update root layout (src/app/_layout.tsx) — conditional routing: show Welcome screen if no auth state, show tabs if guest or authenticated
- [ ] T093 [US7] Update DatabaseProvider — switch between local-only DB (guest) and PowerSync-synced DB (authenticated)

### Tests for User Story 7

- [ ] T094 [P] [US7] Unit test AuthService in tests/unit/services/auth-service.test.ts — sign up, sign in, sign out, delete account (with mocked Supabase client)

**Checkpoint**: Auth and sync functional — guest mode works locally, sign-up migrates data, sync operates across devices

---

## Phase 10: User Story 8 — Daily Reminders (Priority: P8)

**Goal**: Users configure daily reminder at chosen time with encouraging notifications

**Independent Test**: Set reminder time, verify notification fires, check encouraging copy

### Implementation for User Story 8

- [x] T095 [US8] Implement ReminderService in src/services/reminder-service.ts — getConfig, setReminder (schedule via expo-notifications DailyTriggerInput), disable (cancel scheduled notification), getNotificationContent (encouraging messages based on days since last entry)
- [x] T096 [US8] Implement useReminder hook in src/hooks/use-reminder.ts — wraps ReminderService, manages enabled/disabled state and time picker
- [x] T097 [US8] Implement Profile & Settings screen in src/app/(tabs)/profile.tsx — profile card (avatar, name, email, member badge), "JOURNAL" section (Writing Reminders, Privacy & Security, Export Entries), "APP" section (Appearance, Notifications) per design
- [x] T098 [US8] Implement Writing Reminders detail screen — time picker for reminder hour/minute, enable/disable toggle, preview of notification text
- [x] T099 [US8] Request notification permissions on first reminder enable — expo-notifications requestPermissionsAsync

**Checkpoint**: Reminders functional — daily notifications fire at chosen time with warm, encouraging copy

---

## Phase 11: User Story 9 — Search & Filter Entries (Priority: P5+)

**Goal**: Full-text search with emotion, date range, and location filters

**Independent Test**: Create entries with varied content/emotions/dates, search by text, filter by emotion and date range, verify results

### Implementation for User Story 9

- [x] T100 [US9] Complete EntryService search/filter methods — search (FTS5 MATCH query), filterByEmotion (JOIN emotion_record), filterByDateRange per EntryService contract
- [x] T101 [US9] Implement Search & Filter screen — search bar (rounded, icon + placeholder), filter chips (mood/date/location, active gold / inactive bordered), results count label, entry card results list per design
- [x] T102 [US9] Wire search to home screen — search icon in header navigates to search screen, pass current journal context

### Tests for User Story 9

- [ ] T103 [P] [US9] Unit test FTS5 search in tests/unit/services/entry-search.test.ts — full-text match, filter by emotion, filter by date range, combined filters

**Checkpoint**: Search functional — text search returns highlighted results, filters narrow by emotion/date/location

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T104 [P] Implement dark/light theme toggle — currently dark-only, add light theme variant in global.css, wire to Appearance setting in profile
- [ ] T105 [P] Add account deletion flow — confirmation dialog in settings, call AuthService.deleteAccount, clear all local data, navigate to Welcome screen
- [ ] T106 [P] Add onboarding flow — first-launch detection via UserSettings.hasCompletedOnboarding, brief walkthrough of key features
- [ ] T107 Performance optimization — profile app load time (target <2s), optimize FlatList rendering with getItemLayout, add virtualized list for entry feeds, verify 60fps scrolling
- [ ] T108 Edge state handling audit — verify all empty states (no journals, no entries, no emotions, no insights data), error states (storage full, network error, permission denied), loading states across all screens
- [ ] T109 [P] Accessibility pass — verify WCAG 2.1 AA contrast ratios, add accessibilityLabel/accessibilityRole to all interactive elements, test with VoiceOver (iOS) and TalkBack (Android)
- [ ] T110 [P] Run full test suite, fix any failures, verify all tests pass independently
- [ ] T111 Build production APK/IPA via EAS Build, smoke test on physical devices

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — this is the MVP
- **US2 (Phase 4)**: Depends on US1 (entries must exist to attach emotions)
- **US3 (Phase 5)**: Depends on US2 (calendar needs emotion data for mood colors)
- **US4 (Phase 6)**: Depends on US2 (insights need emotion data)
- **US5 (Phase 7)**: Depends on US1 (journal management extends existing journals)
- **US6 (Phase 8)**: Depends on US1 (export needs entries to export)
- **US7 (Phase 9)**: Depends on US1 (auth wraps around existing local-first app)
- **US8 (Phase 10)**: Depends on US1 (reminders need entry tracking)
- **US9 (Phase 11)**: Depends on US1 + US2 (search needs entries + emotions for filters)
- **Polish (Phase 12)**: Depends on all desired user stories being complete

### Parallel Opportunities

After Phase 2 (Foundational), these stories can run in parallel:
- **US5, US6, US7, US8** are all independent of each other (all depend only on US1)
- **US3 and US4** both depend on US2 but are independent of each other

### Within Each User Story

- Services before hooks
- Hooks before components
- Components before screens
- All tasks marked [P] within a phase can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all services in parallel:
Task: "Implement JournalService in src/services/journal-service.ts" [T028]
Task: "Implement EntryService in src/services/entry-service.ts" [T029]
Task: "Implement AttachmentService in src/services/attachment-service.ts" [T030]
Task: "Implement TranscriptionService in src/services/transcription-service.ts" [T031]

# Then hooks (sequential, depend on services):
Task: "Implement useJournals hook" [T032]
Task: "Implement useEntries hook" [T033]
Task: "Implement useAutoSave hook" [T034]
Task: "Implement useTranscription hook" [T035]

# Then components and screens (some parallel):
Task: "Implement JournalList" [T036]
Task: "Implement Editor" [T039]
Task: "Implement Toolbar" [T040]
Task: "Implement DictationButton" [T041]
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Create journal, write entry with formatting + photo + dictation, auto-save, reopen
5. Deploy dev build for internal testing

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Write entries (MVP!)
3. Add US2 → Emotion tracking
4. Add US3 + US4 (parallel) → Calendar + Insights
5. Add US5 + US6 + US7 + US8 (parallel) → Management + Export + Auth + Reminders
6. Add US9 → Search & Filter
7. Polish → Theme, accessibility, performance, production build

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
