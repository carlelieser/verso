# UI Architecture: Daily Journal App

**Branch**: `001-daily-journal-app` | **Date**: 2026-03-20
**Design file**: `~/Documents/verso.pen`

## Design Language

| Token            | Value                          | Usage                                    |
|------------------|--------------------------------|------------------------------------------|
| Background       | `#1A1A1C`                      | All screen backgrounds                   |
| Card surface     | `#242426`                      | Cards, inputs, toolbar, tab bar pill     |
| Card border      | `#3A3A3C` 1px inside           | All cards, inputs, chips                 |
| Subtle surface   | `#2A2A2C`                      | Tags, mood pills, secondary buttons     |
| Accent           | `#C9A962` (warm gold)          | CTAs, FAB, active states, cursor, icons  |
| Accent gradient  | `#C9A962` → `#8B7845` at 135° | Avatar, logo                             |
| Primary text     | `#F5F5F0`                      | Headings, body text, primary labels      |
| Secondary text   | `#6E6E70`                      | Dates, descriptions, inactive labels     |
| Tertiary text    | `#4A4A4C`                      | Placeholders, word counts, day headers   |
| Title font       | Cormorant Garamond             | Page titles (42px), entry titles (28px)  |
| Body font        | Inter                          | All body text, labels, buttons           |
| Section labels   | Inter 11px, 500, ls:3, caps    | RECENT ENTRIES, FILTERS, INTENSITY, etc. |
| Corner radius    | 20px cards, 26px pills, 34px tab bar | Consistent rounded aesthetic       |
| Content padding  | 28px horizontal                | All screens                              |
| Section gap      | 40px between major sections    | Content wrapper gap                      |
| Screen size      | 402 × 874                      | iPhone 14 Pro equivalent                 |

## Screen Inventory

### Tab Screens (5 tabs, persistent pill-style tab bar)

| Tab   | Icon       | Screen            | Purpose                                           |
|-------|------------|-------------------|----------------------------------------------------|
| Home  | `house`    | Journal Feed      | Primary landing — shows recent entries across all journals |
| Calendar | `calendar` | Calendar View | Month grid with mood-colored days + selected day entries |
| Write | `pen-line` | Entry Editor      | Opens editor directly (or creates new entry)       |
| Insights | `bar-chart-3` | Insights & Stats | Streak, monthly stats, mood breakdown        |
| Profile | `user`    | Profile & Settings | Account, reminders, privacy, export, appearance  |

### Detail / Modal Screens (no tab bar)

| Screen             | Entry Point                        | Purpose                                                |
|--------------------|------------------------------------|--------------------------------------------------------|
| Entry Editor       | Write tab, FAB, or tap existing entry | Distraction-free writing with formatting toolbar + dictation |
| Journal Entry View | Tap entry card from feed/calendar  | Read-only view of a completed entry                    |
| Emotion Check-in   | "Add Mood" pill in editor          | Select emotions + adjust intensity sliders             |
| Search & Filter    | Search icon on home screen         | Full-text search with emotion/date/location filters    |
| Export Sheet       | Share icon on entry, or settings   | Bottom sheet with scope + format selection              |
| Welcome & Auth     | First launch (no auth state)       | Logo, value props, Create Account / Continue as Guest  |

## Screen Blueprints

### 1. Home — Journal Feed (`MOcUG`)

**Earns its place**: The user's daily starting point. Shows what matters — recent entries — with zero friction to start writing.

- **Status Bar**: Standard
- **Header**: Greeting ("Good Morning") + date + notification bell
- **Primary content**: Section label "RECENT ENTRIES" + "See All" link → scrollable vertical list of Entry Cards
- **Entry Card anatomy**: Date | Mood pill | Title (Cormorant 18px) | Preview (Inter 12px, 2 lines) | Word count
- **FAB**: Gold circle (+) positioned bottom-right for quick new entry
- **Tab Bar**: Pill-style, 5 tabs, Home active (gold icon pill)
- **Scroll**: Feed scrolls vertically, tab bar fades in with gradient

### 2. Calendar View (`I5n7x`)

**Earns its place**: Visual habit tracking + mood pattern recognition at a glance, without reading anything.

- **Status Bar**: Standard
- **Header**: Month navigation (← March 2026 →) with Cormorant 20px
- **Calendar Grid**: 7-column grid, weekday headers (S M T W T F S), day cells with mood-color dots. Today highlighted with gold circle. Days with entries show small dot indicator.
- **Selected Day Section**: Date label + entry card for selected day
- **Tab Bar**: Calendar active

### 3. Insights & Stats (`3mzyn`)

**Earns its place**: The payoff for consistent journaling — turns raw data into self-awareness.

- **Status Bar**: Standard
- **Header**: "Insights" (Cormorant 42px) + share button
- **Streak Section**: Two stat cards (current streak + longest streak) in a row
- **Monthly Stats**: Two stat cards (entries count + word count) in a row
- **Mood Breakdown**: Card with emoji + label + percentage bar for each top emotion
- **Average Writing Time**: Card with time display + trend indicator
- **Tab Bar**: Insights active

### 4. Profile & Settings (`G2Y4v`)

**Earns its place**: Account management, preferences, and data control — all in one place.

- **Status Bar**: Standard
- **Header**: "Profile" (Cormorant 42px)
- **Profile Card**: Avatar (gold gradient circle) + name + email + member badge
- **Journal Settings**: Writing Reminders, Privacy & Security, Export Entries (list rows with icons + chevrons)
- **App Settings**: Appearance (with "Dark" value), Notifications (list rows)
- **Tab Bar**: Profile active

### 5. Journal Entry View (`ooBNm`)

**Earns its place**: Reading experience for completed entries — distinct from the editor.

- **Status Bar**: Standard
- **Nav Header**: Back arrow + "Entry" label + share/more icons
- **Metadata Row**: Date + mood pill ("😌 Calm")
- **Title**: Cormorant Garamond 28px
- **Hero Image**: Full-width rounded photo (cornerRadius 20)
- **Body**: Inter 14px, line-height 1.7, multiple paragraphs. Italic quote paragraph in `#6E6E70`.
- **Divider**: 1px `#2A2A2C` line
- **Tags**: Pill-shaped tags (Morning, Gratitude, Reflection)
- **Footer**: Word count + reading time | Edit button (gold text + pencil icon)
- **Tab Bar**: Faded gradient overlay, Home active

### 6. Entry Editor (`AYEX7`)

**Earns its place**: The centerpiece — where writing happens. Minimal chrome, maximum focus.

- **Status Bar**: Standard
- **Nav Header**: X (close) | Journal name ("Personal") in secondary text | Undo + more icons
- **Metadata**: Date + "Add Mood" tappable pill (opens Emotion Check-in)
- **Title Field**: Cormorant 28px, editable
- **Body**: Inter 14px, line-height 1.7, editable paragraphs. Gold blinking cursor.
- **Formatting Toolbar** (bottom, absolute): Pill-shaped bar with Bold | Italic | List | Quote | Heading on left, Image + gold Mic (dictation) button on right. Gradient fade above toolbar.
- **No tab bar**: Full focus mode

### 7. Emotion Check-in (`pxesY`)

**Earns its place**: Quick, playful emotion tagging — the bridge between writing and self-awareness.

- **Status Bar**: Standard
- **Header**: "How are you feeling?" (Cormorant 28px) + "Skip" link
- **Subtitle**: Instructional text
- **Emotion Grid**: 2 rows × 5 columns of emotion chips (emoji + label). Selected = gold fill, dark text. Unselected = dark card with border.
- **Intensity Section**: For each selected emotion — emoji + name + value label + gold slider track with thumb
- **CTA**: Full-width gold "Save Emotions" button
- **No tab bar**: Modal context

### 8. Search & Filter (`Wwvn1`)

**Earns its place**: Finding past entries without scrolling through timelines.

- **Status Bar**: Standard
- **Search Bar**: Rounded input (cornerRadius 24) with search icon + placeholder
- **Filter Section**: Label "FILTERS" + "Clear All" link → horizontal filter chips (Mood active in gold, Date/Location inactive with borders)
- **Results**: Count label ("3 RESULTS") + vertical list of entry cards (same style as home feed)
- **No tab bar**: Overlay/push context

### 9. Export Sheet (`VZD7j`)

**Earns its place**: Data ownership — users export their content in the format they need.

- **Dimmed background**: Semi-transparent black overlay
- **Bottom Sheet**: Rounded top corners (24px), drag handle, close X
- **Scope toggle**: "This Entry" (gold active) | "Entire Journal" (inactive)
- **Format options**: Radio-style list — PDF (with gold checkmark, selected) | Markdown (with empty circle, unselected). Each option shows icon + title + description.
- **CTA**: Full-width gold "Export as PDF" button with download icon

### 10. Welcome & Auth (`N6ESg`)

**Earns its place**: First impression — sets the tone and gets users started immediately.

- **Status Bar**: Standard
- **Top Section** (centered): Gold gradient logo (pen icon in rounded square) + "Verso" in Cormorant 48px + tagline
- **Features** (middle): Three feature rows with icon cards (gold icons in dark rounded squares) + title + description. Writing, Emotion Tracking, Privacy.
- **Buttons** (bottom): Gold "Create Account" CTA + bordered "Continue as Guest" secondary + "Already have an account? Sign In" link
- **No tab bar**: Pre-auth state

## Navigation Flow

```
Welcome & Auth
├── Create Account → Sign Up Form → Home (Journal Feed)
├── Continue as Guest → Home (Journal Feed)
└── Sign In → Sign In Form → Home (Journal Feed)

Home (Journal Feed)
├── Entry Card tap → Journal Entry View
├── FAB (+) → Entry Editor (new entry)
├── Notification bell → (future)
├── "See All" → Journal timeline
└── Search icon → Search & Filter

Entry Editor
├── "Add Mood" pill → Emotion Check-in (modal)
├── Mic button → Dictation mode (in-editor)
├── Image button → Photo picker
└── X (close) → Back to previous screen

Journal Entry View
├── Edit button → Entry Editor (edit mode)
├── Share icon → Export Sheet
├── More icon → Delete / Move journal
└── Back arrow → Previous screen

Calendar View
├── Day tap (single entry) → Journal Entry View
├── Day tap (multiple entries) → Entry list for that day
└── Month arrows → Navigate months

Insights & Stats
├── Share button → Export insight as image
└── (Drill-down into specific charts — future)

Profile & Settings
├── Writing Reminders → Reminder time picker
├── Privacy & Security → Encryption settings
├── Export Entries → Export Sheet
├── Appearance → Theme toggle
└── Notifications → Notification preferences
```

## Component Hierarchy

### Shared Components (used across multiple screens)

| Component       | Used In                                | Description                              |
|-----------------|----------------------------------------|------------------------------------------|
| Status Bar      | All screens                            | Time + signal/wifi/battery icons         |
| Tab Bar         | Home, Calendar, Insights, Profile, Entry View | Pill-shaped, 5 tabs, gradient fade |
| Entry Card      | Home feed, Calendar, Search results    | Date + mood + title + preview + word count |
| Mood Pill       | Entry cards, Entry View, Editor        | Emoji + label in rounded chip            |
| Section Label   | All content screens                    | ALL-CAPS, Inter 11px, letter-spacing 3   |
| Gold CTA Button | Emotion check-in, Export, Welcome      | Full-width, cornerRadius 26, gold fill   |
| Tag Pill        | Entry View, filter chips               | Rounded chip with icon/text              |

### Screen-Specific Components

| Component           | Screen          | Description                              |
|---------------------|-----------------|------------------------------------------|
| Formatting Toolbar  | Entry Editor    | Pill bar with format buttons + mic       |
| Emotion Grid        | Emotion Check-in| 2×5 grid of selectable emotion chips     |
| Intensity Slider    | Emotion Check-in| Emoji + label + gold track + thumb       |
| Calendar Grid       | Calendar View   | Month grid with mood-dot day cells       |
| Streak Card         | Insights        | Large number + label stat display        |
| Mood Bar            | Insights        | Emoji + label + percentage progress bar  |
| Search Bar          | Search & Filter | Rounded input with icon                  |
| Filter Chip         | Search & Filter | Active (gold) / inactive (bordered) chip |
| Profile Card        | Profile         | Avatar + name + email + badge            |
| Settings Row        | Profile         | Icon + label + chevron/value             |
| Export Format Option | Export Sheet   | Icon + title + desc + radio indicator    |
| Bottom Sheet        | Export          | Drag handle + rounded top corners        |
| Feature Row         | Welcome         | Icon card + title + description          |
