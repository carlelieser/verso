# Feature Specification: Daily Journal App

**Feature Branch**: `001-daily-journal-app`
**Created**: 2026-03-20
**Status**: Draft
**Input**: User description: "Build a daily journaling app for the general public that balances beauty and simplicity with emotion tracking and meaningful insights."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Write a Journal Entry (Priority: P1)

A user opens the app, sees their list of journals, taps into one (or creates a new journal), and creates an entry in a distraction-free editor. They can type using rich text formatting — headings, bold, bullet lists — or dictate their entry using voice-to-text, which transcribes spoken words into the editor in real time. Typing and dictation are interchangeable — a user can switch between them freely within the same entry. They optionally embed a photo from their day inline within the text. When finished, they close the editor and the entry is saved automatically. The entire flow takes under three minutes.

**Why this priority**: Writing is the core value proposition. Without a beautiful, functional writing experience, nothing else matters. This story delivers a usable journaling app on its own.

**Independent Test**: Can be fully tested by creating a journal, writing an entry using both typing and voice dictation with formatting and an embedded photo, closing the app, and reopening to verify the entry persists with all content intact.

**Acceptance Scenarios**:

1. **Given** a user with no journals, **When** they open the app and tap "New Journal," **Then** they can name the journal and it appears in their journal list.
2. **Given** a user viewing a journal, **When** they create a new entry, **Then** a distraction-free editor opens with a blank page, clean typography, and generous whitespace.
3. **Given** a user writing in the editor, **When** they apply bold, italic, heading, bullet list, numbered list, quote, or divider formatting, **Then** the formatting renders immediately inline.
4. **Given** a user writing an entry, **When** they embed a photo, **Then** the photo appears inline within the text body at the insertion point.
5. **Given** a user who stops writing, **When** they navigate away from the editor, **Then** the entry is saved automatically without any explicit save action.
6. **Given** a user with an existing entry, **When** they reopen it, **Then** all text, formatting, and embedded photos are preserved exactly as written.
7. **Given** a user in the editor, **When** they tap the dictation button, **Then** voice-to-text transcription begins and spoken words appear in the editor in real time.
8. **Given** a user dictating an entry, **When** they stop dictation, **Then** the transcribed text is editable like any typed text and can be formatted normally.
9. **Given** a user who has been dictating, **When** they start typing, **Then** the input mode switches seamlessly and both typed and dictated content coexist in the same entry.

---

### User Story 2 - Track Emotions on an Entry (Priority: P2)

After (or before) writing an entry, the user completes an emotion check-in. They see an emotion wheel with categories like happy, sad, anxious, calm, frustrated, excited, grateful, angry, hopeful, and tired. They tap one or more emotions and adjust an intensity slider (1-5) for each selected emotion. The interaction feels quick and playful, not clinical. The emotion data is attached to the entry.

**Why this priority**: Emotion tracking transforms a plain journal into a self-awareness tool. It is the foundation for insights (P4) and the calendar mood view (P3), and differentiates this app from generic note-taking tools.

**Independent Test**: Can be tested by writing an entry, completing the emotion check-in with multiple emotions at different intensities, saving, and reopening to verify emotion data persists on the entry.

**Acceptance Scenarios**:

1. **Given** a user viewing an entry, **When** they open the emotion check-in, **Then** they see a predefined emotion wheel with at least 10 emotion categories.
2. **Given** a user in the emotion check-in, **When** they tap an emotion, **Then** it is selected and an intensity slider (1-5) appears for that emotion.
3. **Given** a user in the emotion check-in, **When** they select multiple emotions, **Then** each selected emotion has its own independent intensity slider.
4. **Given** a user who has completed the emotion check-in, **When** they view the entry later, **Then** the selected emotions and their intensities are displayed on the entry.
5. **Given** a user who skips the emotion check-in, **When** they save the entry, **Then** the entry is saved successfully without any emotion data and a gentle prompt encourages them to add emotions next time.

---

### User Story 3 - Browse Entries on a Calendar (Priority: P3)

A user opens the calendar view and sees a monthly calendar where days with entries are visually highlighted. Days are color-coded to reflect the dominant mood recorded that day. Tapping a day reveals that day's entry or entries. The calendar gives users an immediate visual sense of their journaling consistency and emotional patterns.

**Why this priority**: The calendar provides the first layer of pattern recognition — users see their habits and moods at a glance without needing charts or data analysis. It also serves as the primary navigation method for finding past entries.

**Independent Test**: Can be tested by creating entries across multiple days with different emotions, opening the calendar, verifying day highlights and mood colors match, and tapping days to navigate to entries.

**Acceptance Scenarios**:

1. **Given** a user with entries on various days, **When** they open the calendar view, **Then** days with entries are visually distinguished from days without entries.
2. **Given** a user with emotion data on entries, **When** they view the calendar, **Then** each day with entries is color-coded to reflect the dominant mood for that day.
3. **Given** a user viewing the calendar, **When** they tap a day with one entry, **Then** that entry opens directly.
4. **Given** a user viewing the calendar, **When** they tap a day with multiple entries, **Then** they see a list of that day's entries and can select one to open.
5. **Given** a user viewing the calendar, **When** they swipe or navigate between months, **Then** the calendar updates to show the selected month with appropriate entry highlights and mood colors.

---

### User Story 4 - View Emotional Insights (Priority: P4)

A user navigates to the insights section and sees visual summaries of their emotional life: mood trends over weeks and months, most frequent emotions, journaling streaks, and how emotions shift over time. The visualizations are compelling — charts, mood heatmaps, streak counters. The user can export any insight view as a PDF or image to share with a therapist, friend, or on social media.

**Why this priority**: Insights are the payoff for consistent journaling and emotion tracking. They deliver the "aha moment" that keeps users engaged long-term. However, they require accumulated data from P1-P3 to be meaningful.

**Independent Test**: Can be tested by creating entries with varied emotions over a simulated time period, opening insights, verifying charts and heatmaps render correctly, and exporting an insight view as an image or PDF.

**Acceptance Scenarios**:

1. **Given** a user with at least two weeks of entries with emotion data, **When** they open the insights view, **Then** they see mood trend charts showing emotion frequency and intensity over time.
2. **Given** a user with emotion data, **When** they view insights, **Then** they see their most frequent emotions ranked and their current journaling streak.
3. **Given** a user viewing an insight chart or heatmap, **When** they tap "Export," **Then** they can save the view as a PDF or image to their device.
4. **Given** a user with entries spanning multiple months, **When** they view mood trends, **Then** they can filter by time range (week, month, 3 months, year).
5. **Given** a user who has missed journaling days, **When** they view streak data, **Then** the tone is encouraging ("Welcome back! Your best streak was 14 days") rather than punitive.

---

### User Story 5 - Manage Journals and Entries (Priority: P5)

A user manages their journal collection: renaming a journal, reordering journals in the list, and deleting a journal (with confirmation). They can also tag entries with locations (manually entered or from their device), add voice memos or file attachments, and delete individual entries.

**Why this priority**: Journal management and entry enrichment round out the core experience. These are not needed for MVP writing and emotion tracking but are essential for long-term usability and the full vision of the app.

**Independent Test**: Can be tested by creating multiple journals, renaming one, reordering them, deleting one (verifying confirmation dialog), and adding a location tag and attachment to an entry.

**Acceptance Scenarios**:

1. **Given** a user viewing their journal list, **When** they long-press or swipe on a journal, **Then** they see options to rename, reorder, or delete the journal.
2. **Given** a user who taps delete on a journal, **When** the confirmation dialog appears, **Then** the journal and all its entries are permanently removed only after confirmation.
3. **Given** a user editing an entry, **When** they add a location, **Then** they can either type a location name manually or use their device's current location.
4. **Given** a user editing an entry, **When** they attach a voice memo or file, **Then** the attachment appears on the entry and can be played or opened later.
5. **Given** a user viewing their journal list, **When** they drag journals to reorder, **Then** the new order persists across app sessions.

---

### User Story 6 - Export Journal Data (Priority: P6)

A user exports an entire journal or individual entries as PDF (preserving formatting and photos) or as Markdown/JSON (for portability). This ensures users never feel locked into the app and maintain full ownership of their data.

**Why this priority**: Export is a trust-building feature. While not needed for daily use, it removes a key objection to adoption ("what if I want to leave?") and supports the privacy-first principle.

**Independent Test**: Can be tested by creating entries with formatting and photos, exporting as PDF and Markdown, and verifying the exported files preserve content accurately.

**Acceptance Scenarios**:

1. **Given** a user viewing a journal, **When** they select "Export Journal," **Then** they can choose between PDF and Markdown/JSON formats.
2. **Given** a user exporting as PDF, **When** the export completes, **Then** the PDF preserves all text formatting, embedded photos, and entry metadata (date, emotions).
3. **Given** a user exporting as Markdown, **When** the export completes, **Then** each entry is a separate Markdown file with frontmatter containing date, emotions, and location.
4. **Given** a user viewing a single entry, **When** they select "Export Entry," **Then** they can export just that entry in PDF or Markdown format.

---

### User Story 7 - Sign Up and Sync (Priority: P7)

A user can sign up with email or continue as a guest. Guest users store all data locally on their device. Signed-in users get their entries synced across devices. The sign-up process is minimal and non-intrusive — the app is fully usable as a guest, and signing up is positioned as an optional upgrade for multi-device access.

**Why this priority**: Authentication and sync are infrastructure concerns. The app must work perfectly as a local-only guest experience first. Sync is a convenience feature, not a prerequisite for journaling.

**Independent Test**: Can be tested by using the app as a guest (verifying local persistence), signing up with email, and verifying entries sync to a second device.

**Acceptance Scenarios**:

1. **Given** a new user opening the app for the first time, **When** they choose "Continue as Guest," **Then** they can immediately start creating journals and entries with all data stored locally.
2. **Given** a guest user, **When** they decide to sign up with email, **Then** their existing local data is preserved and associated with their new account.
3. **Given** a signed-in user with entries on one device, **When** they sign in on a second device, **Then** all journals and entries sync automatically.
4. **Given** a signed-in user, **When** they write an entry on one device, **Then** the entry appears on their other devices within a reasonable time.
5. **Given** a signed-in user, **When** they lose network connectivity, **Then** they can continue writing and their entries sync when connectivity resumes.

---

### User Story 8 - Daily Reminders (Priority: P8)

A user configures a daily reminder to journal at a time they choose. The reminder notification uses an encouraging, warm tone. If the user has missed days, the notification does not guilt them — it welcomes them back.

**Why this priority**: Reminders support habit formation but are not essential for the core journaling experience. They enhance retention for users who opt in.

**Independent Test**: Can be tested by setting a reminder time, verifying the notification fires at the correct time, and checking the notification copy for encouraging tone.

**Acceptance Scenarios**:

1. **Given** a user in settings, **When** they enable daily reminders and select a time, **Then** they receive a notification at that time each day.
2. **Given** a user who journaled yesterday, **When** the reminder fires, **Then** the notification uses encouraging language (e.g., "Ready to reflect on your day?").
3. **Given** a user who has not journaled in several days, **When** the reminder fires, **Then** the notification uses welcoming language (e.g., "Welcome back! Your journal is waiting for you.").
4. **Given** a user who disables reminders, **When** the configured time passes, **Then** no notification is sent.

---

### Edge Cases

- What happens when a user tries to delete their only journal? The app should allow it — journals are user-managed and an empty state is valid. The home screen shows a prompt to create a new journal.
- What happens when a user embeds a very large photo? The app should resize/compress the photo to a reasonable display size while preserving acceptable quality.
- What happens when a guest user's device storage is full? The app should display a clear error message explaining that local storage is full and suggest freeing space or signing up for cloud sync.
- What happens when a synced user edits the same entry on two devices simultaneously? The most recent edit wins (last-write-wins), and the app should not lose data silently — the overwritten version should be recoverable for a limited time.
- What happens when the emotion wheel categories don't capture what the user is feeling? For v1, the predefined set is fixed. A "Other" option with a free-text label could be considered for a future version.
- What happens when a user exports a journal with hundreds of entries as PDF? The export should handle large journals gracefully, showing progress and not freezing the UI.
- What happens when a user has no emotion data and opens insights? The insights view should show an encouraging empty state explaining what insights will look like once they start tracking emotions.

## Requirements *(mandatory)*

### Functional Requirements

**Journals**
- **FR-001**: System MUST allow users to create multiple named journals, each acting as an independent notebook.
- **FR-002**: System MUST allow users to rename, reorder, and delete journals.
- **FR-003**: System MUST require confirmation before deleting a journal and all its entries.
- **FR-004**: System MUST display the user's journal list as the primary home screen.

**Entries & Editor**
- **FR-005**: System MUST provide a block-based, distraction-free rich text editor for journal entries.
- **FR-006**: System MUST support headings, bold, italic, bullet lists, numbered lists, block quotes, and dividers.
- **FR-007**: System MUST auto-save entries as the user types — no explicit save action required.
- **FR-008**: System MUST allow users to embed photos inline within the entry body at any insertion point.
- **FR-009**: System MUST allow users to tag entries with a location (manual text entry or device geolocation).
- **FR-010**: System MUST allow users to attach voice memos, links, and files to entries.
- **FR-011**: Each entry MUST belong to exactly one journal and display its creation date.
- **FR-012**: System MUST provide voice-to-text dictation as an alternative to typing, with real-time transcription into the editor.
- **FR-013**: Users MUST be able to switch freely between typing and dictation within the same entry.
- **FR-014**: Dictated text MUST be indistinguishable from typed text — fully editable and formattable after transcription.

**Emotion Tracking**
- **FR-015**: System MUST provide an emotion check-in on each entry with a predefined emotion wheel containing at least: happy, sad, anxious, calm, frustrated, excited, grateful, angry, hopeful, and tired.
- **FR-016**: System MUST allow users to select multiple emotions per entry.
- **FR-017**: Each selected emotion MUST have an intensity slider with a 1-5 scale.
- **FR-018**: Emotion check-in MUST be optional — entries save successfully without emotion data.
- **FR-019**: System SHOULD gently encourage emotion tracking when skipped (non-blocking prompt).

**Calendar**
- **FR-020**: System MUST provide a calendar view showing which days have entries.
- **FR-021**: Calendar days MUST be color-coded to reflect the dominant mood when emotion data exists.
- **FR-022**: Tapping a calendar day MUST navigate to that day's entry (or list of entries if multiple exist).

**Insights**
- **FR-023**: System MUST generate mood trend visualizations over configurable time ranges (week, month, 3 months, year).
- **FR-024**: System MUST display most frequent emotions, journaling streaks, and streak history.
- **FR-025**: System MUST show a mood heatmap on the calendar view.
- **FR-026**: System MUST allow users to export any insight view as PDF or image.
- **FR-027**: Streak display MUST use encouraging, non-punitive language.

**Search & Filtering**
- **FR-028**: System MUST provide full-text search across all entries within a journal.
- **FR-029**: System MUST allow users to filter entries by emotion, date range, and location.
- **FR-030**: Search results MUST highlight matching text and allow direct navigation to the entry.

**Export**
- **FR-031**: System MUST allow users to export individual entries or entire journals.
- **FR-032**: Export formats MUST include PDF (preserving formatting and photos) and Markdown or JSON (for portability).

**Authentication & Sync**
- **FR-033**: System MUST allow users to sign up with email or continue as a guest.
- **FR-034**: Guest users MUST have all data stored locally on their device.
- **FR-035**: Signed-in users MUST have entries synced across devices.
- **FR-036**: Guest-to-account migration MUST preserve all existing local data.
- **FR-037**: Signed-in users MUST be able to continue working offline with automatic sync on reconnection.

**Reminders**
- **FR-038**: System MUST allow users to set a daily reminder at a user-chosen time.
- **FR-039**: Reminder notifications MUST use encouraging, warm tone — never guilt or shame for missed days.

**Privacy & Security**
- **FR-040**: System MUST NOT include any social features, public profiles, or shared feeds.
- **FR-041**: All journals MUST be private and visible only to the user who created them.
- **FR-042**: System MUST encrypt all entry data (text, photos, emotion records) at rest on the device using OS-level keychain/keystore protection.
- **FR-043**: Signed-in users MUST be able to delete their account, which permanently removes all data from local storage and cloud with no recovery. Deletion requires confirmation.

### Key Entities

- **User**: A person using the app. Can be a guest (local-only) or authenticated (email sign-up). Has a list of journals, reminder preferences, and account settings.
- **Journal**: A named notebook that contains entries. Has a name, display order, creation date, and belongs to exactly one user. Can be renamed, reordered, and deleted.
- **Entry**: A single journal entry belonging to one journal. Contains rich text content (block-based), a creation date, an optional location tag, optional embedded photos, optional attachments (voice memos, files, links), and optional emotion data.
- **EmotionRecord**: An emotion check-in attached to an entry. Contains one or more emotion selections, each with a category (from the predefined wheel) and an intensity value (1-5).
- **Attachment**: A media artifact attached to an entry. Can be a photo (embedded inline), voice memo, file, or link. Photos are stored with the entry content; other attachments are referenced.
- **Reminder**: A user's daily notification preference. Contains an enabled/disabled flag and a time-of-day setting.

### Assumptions

- v1 targets iOS and Android using a single cross-platform codebase. Web is out of scope for v1.
- The predefined emotion wheel is fixed for v1 with 10 categories. Extensibility (custom emotions) is deferred to a future version.
- "Dominant mood" for calendar color-coding is determined by the emotion with the highest intensity on a given day. If a day has multiple entries, the most recent entry's highest-intensity emotion is used.
- PDF export preserves visual formatting as closely as possible but is not guaranteed to be pixel-perfect across all devices.
- Sync conflict resolution uses last-write-wins with a short-term recovery window for overwritten versions. The exact recovery duration is an implementation detail.
- v1 has no premium tier — all features are free.
- Voice memo recording uses the device's built-in microphone and standard recording capabilities.
- The app MUST handle up to 5,000 entries per journal without performance degradation. This covers approximately 13 years of daily journaling.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can create a journal, write a formatted entry with an embedded photo, complete an emotion check-in, and close the app in under 3 minutes on first use.
- **SC-002**: 80% of users who write entries also complete the emotion check-in, indicating the interaction feels natural and non-burdensome.
- **SC-003**: Users maintain a 7-day journaling streak within their first month at a rate of 40% or higher, indicating the app successfully builds the habit.
- **SC-004**: The calendar view accurately reflects journaling activity and mood colors for 100% of days that have entries with emotion data.
- **SC-005**: Users with 30+ days of emotion data report that insights revealed a pattern they had not previously noticed, at a rate of 60% or higher (measured via optional in-app survey).
- **SC-006**: Exported PDFs preserve all text formatting and embedded photos with no missing or corrupted content.
- **SC-007**: Guest-to-account migration preserves 100% of local data with zero data loss.
- **SC-008**: Signed-in users see entries sync across devices within 30 seconds under normal network conditions.
- **SC-009**: The app loads to the journal list screen in under 2 seconds on a mid-range device.
- **SC-010**: 90% of users who try the export feature successfully export a journal or entry on their first attempt.

## Clarifications

### Session 2026-03-20

- Q: What platform(s) should the app target for v1? → A: iOS and Android (cross-platform, single codebase). Web is out of scope for v1.
- Q: Should the app support searching or filtering entries? → A: Yes — full-text search plus filters by emotion, date range, and location.
- Q: Should entry data be encrypted at rest on the device? → A: Yes — encrypt using OS-level device protection (keychain/keystore). No user-managed passphrase for v1.
- Q: Can users delete their account and all associated data? → A: Yes — full immediate permanent deletion of all data (local + cloud), with confirmation. No recovery grace period.
- Q: Max entries per journal without performance degradation? → A: 5,000 entries (~13 years of daily use). Lazy loading and indexed search required at scale.
