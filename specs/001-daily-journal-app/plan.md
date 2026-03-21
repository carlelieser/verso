# Implementation Plan: Daily Journal App

**Branch**: `001-daily-journal-app` | **Date**: 2026-03-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-daily-journal-app/spec.md`

## Summary

Build a cross-platform (iOS + Android) daily journaling app using React Native + Expo with a beautiful, distraction-free rich text editor, multi-dimensional emotion tracking with intensity sliders, calendar-based entry browsing with mood color-coding, visual emotional insights, on-device voice dictation via Whisper, and offline-first local storage with optional cloud sync. The app uses HeroUI Native for UI components, expo-sqlite with Drizzle ORM for local data (encrypted via SQLCipher), react-native-enriched for the block-based editor, whisper.rn for on-device transcription, Supabase for auth, and PowerSync for cross-device sync.

## Technical Context

**Language/Version**: TypeScript 5.x, React Native 0.84+, Expo SDK 54+
**Primary Dependencies**: heroui-native, react-native-enriched, whisper.rn, drizzle-orm, expo-sqlite (SQLCipher), @supabase/supabase-js, @powersync/react-native, react-native-calendars, react-native-gifted-charts, expo-notifications, expo-print
**Storage**: SQLite (local, encrypted via SQLCipher) + Supabase Postgres (cloud sync for authenticated users)
**Testing**: Jest + React Native Testing Library (unit/component), Detox or Maestro (E2E)
**Target Platform**: iOS 16+ and Android (API 24+), cross-platform via Expo
**Project Type**: Mobile app
**Performance Goals**: <2s app load, <100ms UI interactions, <3min entry creation flow, 60fps scrolling
**Constraints**: Offline-capable, <200ms p95 for local DB queries, ~75MB Whisper model download, SQLCipher encryption at rest
**Scale/Scope**: Up to 5,000 entries per journal, ~15 screens, local-first architecture

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Type-Safe Code Quality

- [x] `strict: true` and `noUncheckedIndexedAccess` enabled in tsconfig.json
- [x] `any` banned via ESLint (`@typescript-eslint/no-explicit-any`)
- [x] Discriminated unions used for auth state, transcription status, attachment type, export format
- [x] All services defined as interfaces (see contracts/service-interfaces.md)
- [x] Domain error classes planned: `JournalNotFoundError`, `EntryNotFoundError`, `ExportError`, `TranscriptionError`
- [x] Immutability: all service method params use `readonly`, return `readonly` arrays

### II. Testing Standards

- [x] Contract tests planned for each service interface
- [x] Integration tests planned for DB operations (Drizzle + expo-sqlite)
- [x] Component tests planned for editor, emotion wheel, calendar, insights
- [x] All tests independently runnable (fresh DB per test)

### III. User Experience Consistency

- [x] Single design system: HeroUI Native with Uniwind theming
- [x] All edge states handled: empty journals, empty entries, no emotions, no insights data, offline, storage full
- [x] Error messages are user-facing and actionable (not raw errors)
- [x] Dark mode supported via HeroUI Native / Uniwind

### IV. Performance Requirements

- [x] Performance budgets defined: <2s load, <100ms interactions, <200ms DB queries
- [x] WAL mode + indexes planned for SQLite performance
- [x] Lazy loading for entry lists, debounced auto-save (500ms), paginated queries
- [x] Whisper model downloaded on demand (not bundled) to keep install size small

**Result**: All constitution gates pass. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/001-daily-journal-app/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── service-interfaces.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/                     # Expo Router screens
│   ├── (tabs)/              # Tab navigator
│   │   ├── index.tsx        # Home — journal list
│   │   ├── calendar.tsx     # Calendar view
│   │   └── insights.tsx     # Insights dashboard
│   ├── journal/
│   │   └── [id].tsx         # Journal timeline (entry list)
│   ├── entry/
│   │   ├── [id].tsx         # Entry editor
│   │   └── emotions.tsx     # Emotion check-in sheet
│   ├── auth/
│   │   ├── sign-in.tsx      # Sign in screen
│   │   └── sign-up.tsx      # Sign up screen
│   ├── settings/
│   │   └── index.tsx        # Settings (reminders, account, export)
│   └── _layout.tsx          # Root layout with providers
├── components/
│   ├── editor/              # Rich text editor wrapper
│   │   ├── editor.tsx       # react-native-enriched wrapper
│   │   ├── toolbar.tsx      # Formatting toolbar
│   │   └── dictation-button.tsx
│   ├── emotions/
│   │   ├── emotion-wheel.tsx
│   │   └── intensity-slider.tsx
│   ├── calendar/
│   │   ├── mood-calendar.tsx
│   │   └── day-cell.tsx
│   ├── insights/
│   │   ├── mood-trend-chart.tsx
│   │   ├── emotion-frequency.tsx
│   │   ├── streak-counter.tsx
│   │   └── mood-heatmap.tsx
│   ├── journals/
│   │   ├── journal-list.tsx
│   │   ├── journal-card.tsx
│   │   └── create-journal-sheet.tsx
│   └── common/
│       ├── empty-state.tsx
│       ├── loading-state.tsx
│       └── error-boundary.tsx
├── db/
│   ├── schema.ts            # Drizzle table definitions
│   ├── relations.ts         # Drizzle relation definitions
│   ├── client.ts            # DB initialization (SQLCipher, WAL, FTS5)
│   ├── fts.ts               # FTS5 virtual table and trigger setup
│   └── migrations.ts        # Migration runner
├── services/
│   ├── journal-service.ts
│   ├── entry-service.ts
│   ├── emotion-service.ts
│   ├── insights-service.ts
│   ├── attachment-service.ts
│   ├── location-service.ts
│   ├── auth-service.ts
│   ├── export-service.ts
│   ├── reminder-service.ts
│   └── transcription-service.ts
├── hooks/
│   ├── use-journals.ts
│   ├── use-entries.ts
│   ├── use-emotions.ts
│   ├── use-insights.ts
│   ├── use-auth.ts
│   ├── use-auto-save.ts
│   ├── use-transcription.ts
│   └── use-reminder.ts
├── providers/
│   ├── auth-provider.tsx
│   ├── database-provider.tsx
│   └── sync-provider.tsx
├── types/
│   ├── journal.ts
│   ├── entry.ts
│   ├── emotion.ts
│   ├── attachment.ts
│   └── common.ts
├── constants/
│   ├── emotions.ts          # Emotion categories, colors, icons
│   └── theme.ts             # App theme overrides
├── utils/
│   ├── html-to-markdown.ts
│   ├── date.ts
│   └── image.ts
└── errors/
    └── domain-errors.ts

tests/
├── unit/
│   ├── services/
│   └── utils/
├── integration/
│   └── db/
└── component/
    └── components/
```

**Structure Decision**: Single-project Expo Router app organized by feature. Services layer abstracts all data operations behind interfaces. Screens are thin — they compose components and call hooks which delegate to services.

## Complexity Tracking

No constitution violations to justify. All principles are satisfied by the chosen architecture.
