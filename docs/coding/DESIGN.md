# Design Foundations

Every visual decision must be traceable to a principle or a system. Nothing arbitrary.

---

## Core Principles

- **Intentionality.** Every spacing value, color, type size, and radius is a deliberate choice from a defined scale. If you can't explain why a value is what it is, it's wrong.
- **Systems over decisions.** Build systems (scales, palettes, tokens) that make consistency the default. Individual choices should flow from the system, not from ad-hoc judgment.
- **Restraint.** Every element must earn its place. More whitespace, fewer colors, less decoration. The courage to subtract is the highest design skill.
- **Respect for the user.** Design serves the user's goals, not the designer's taste. Unobtrusive, honest, thorough to the last detail (Dieter Rams).

---

## Spacing

**MUST** use Tailwind's 4pt grid exclusively. All spacing values are integers on this scale:

| Class | Value | Common use |
|-------|-------|------------|
| `1` | 4px | Micro gaps, icon-to-label |
| `2` | 8px | Tight element spacing |
| `3` | 12px | List gaps, card internal spacing |
| `4` | 16px | Standard padding, content margins |
| `5` | 20px | Section internal spacing |
| `6` | 24px | Section padding, bottom sheet content |
| `8` | 32px | Large section gaps |
| `10` | 40px | Generous breathing room |
| `12` | 48px | Large containers |
| `16` | 64px | Empty state vertical padding |

**NEVER** use fractional values (`gap-1.5`, `px-2.5`, `py-3.5`). If a value doesn't land on the grid, round to the nearest step.

**NEVER** use inline `style={{}}` for spacing that can be expressed as a Tailwind class. Inline styles are reserved for dynamic values (safe area insets, animated styles).

---

## Typography

**Type scale** follows Tailwind's defaults, mapped to consistent roles:

| Role | Class | Size |
|------|-------|------|
| Page title | `text-5xl font-heading` | 48px |
| Sheet/modal title | `text-3xl font-heading` | 30px |
| Card heading | `text-lg` | 18px |
| Body | `text-base` | 16px |
| Secondary | `text-sm` | 14px |
| Caption | `text-xs` | 12px |
| Overline | `Overline` component | 11px, 500 weight, 3px tracking |

**MUST** use the `Overline` component for uppercase section labels. Do not recreate the style inline.

**MUST** use `font-heading` (DM Serif Display) for page and sheet titles only. Body text uses the default font (Google Sans Flex).

**MUST** use `font-editor` (Libre Baskerville) only inside the rich text editor.

---

## Color

**MUST** use Tailwind theme classes (`text-foreground`, `bg-surface`, `border-border`, `text-accent`, etc.) for all color. These resolve to CSS variables defined in `global.css` and adapt to light/dark mode automatically.

**MUST** use `useThemeColors()` only when a color value must be passed as a prop (e.g., icon `color={muted}`), not for `style={{}}` on Views or Text.

**NEVER** hardcode hex values. If a color isn't in the theme, add it to `global.css`.

The palette is intentionally small:
- `foreground` / `background` -- primary content and canvas
- `surface` -- elevated containers (cards, inputs)
- `muted` -- secondary/disabled text and icons
- `accent` / `accent-foreground` -- primary actions and highlights
- `border` / `separator` -- structural lines
- `danger` / `success` / `warning` -- semantic states

---

## Border Radius

**MUST** use Tailwind radius classes consistently:

| Class | Value | Use |
|-------|-------|-----|
| `rounded-lg` | 8px | Code blocks, small containers |
| `rounded-xl` | 12px | Cards, inputs, icon buttons |
| `rounded-full` | 9999px | Pills, FAB, avatar containers, emotion tags |

**NEVER** use arbitrary radius values. Pick from the scale above.

---

## Icons

All icons come from `lucide-react-native`. Sizes follow consistent roles:

| Size | Use |
|------|-----|
| 14 | Metadata (inline with small text) |
| 16 | Toolbar buttons, menu items, inline actions |
| 18 | Editor format bar |
| 20 | Navigation, card actions |
| 24 | FAB icon, primary actions |
| 28 | Page-level decorative (journal title icon) |
| 48 | Empty state |

---

## Components as Design Tokens

When a visual pattern appears 3+ times, extract it into a component. The component becomes the single source of truth for that pattern's styling. Examples:
- `Overline` -- uppercase section labels
- `EmptyState` -- centered icon + title + description
- `Fab` -- floating action button (size and shape only, not position)
- `SearchInput` -- search field with icon

**MUST** keep layout concerns (positioning, margins relative to siblings) in the consumer, not baked into the component. A `Fab` is a button, not a bottom-right-absolute-positioned button.

---

## Whitespace

Whitespace is an active design element, not empty space.

- More space around an element = more perceived importance.
- Related elements closer together than unrelated ones (Gestalt proximity).
- Generous whitespace signals quality. Cramped layouts signal budget.
- Empty states, modals, and onboarding screens should breathe -- don't fill every pixel.

---

## Hierarchy

Every screen should have a clear visual hierarchy. The user's eye should know where to go without thinking.

- **Size** creates primary hierarchy (page title > section title > body > caption).
- **Weight** creates secondary hierarchy (semibold label vs. regular description).
- **Color** creates tertiary hierarchy (`text-foreground` > `text-muted`).
- **Space** creates grouping (proximity) and emphasis (isolation).

If two elements look equally important but one matters more, the hierarchy has failed.
