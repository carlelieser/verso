# Verso

React Native (Expo) journaling app. TypeScript, Tailwind (NativeWind), feature-based structure.

## Workflow

1. Read existing code before changing anything — reuse what exists.
2. Run `/simplify` after implementation.
3. Run formatter and linter before committing.
4. Human approval required before any commit.

## Code Style

**Naming:** `camelCase` variables/functions, `PascalCase` types/components, `CONSTANT_CASE` module constants, `kebab-case` filenames. Prefix booleans with `is`/`has`/`can`/`should`/`will`. Treat acronyms as words (`loadHttpUrl`). No `I` prefix on interfaces. No abbreviations.

**Functions:** Single responsibility. Options object for 3+ parameters. Annotate return types on exports. Prefer guard clauses over nesting. Keep under 20 lines.

**Types:** `strict: true` with `noUncheckedIndexedAccess`. No `any` — use `unknown`. No `as` or `!` assertions. `interface` for shapes, `type` for unions/intersections. `export type` for type-only exports. Prefer string unions over enums. Discriminated unions to model state.

**Modules:** Named exports only — no default exports. Import order: node built-ins → external → aliased (`@/*`) → relative. Feature-based organization, not file-type-based.

**Null safety:** `??` not `||` for defaults. `?.` for access. Explicit checks over truthiness when `0`/`""`/`false` are valid.

**Errors:** Fail fast at boundaries. `unknown` catch types, narrow before use. Preserve cause with `{ cause: error }`. Never swallow errors silently.

**Async:** Handle every rejection. `for...of` or `Promise.all` — never `forEach` with async.

**Immutability:** Default to creating new values. `readonly` on properties and parameters that shouldn't mutate.

## React

Function components only. Props typed with `interface`, not `React.FC`. Hooks at top level only. Honest `useEffect` deps — never suppress the lint rule. Clean up effects. Stable unique keys from data IDs.

**State:** `useState` → lift up → `useReducer` → Context/library. Derive state during render — don't sync with `useState`. `useEffect` for external system sync only. Context for low-frequency globals (theme, auth).

**Handlers:** `handle` prefix for definitions, `on` prefix for props.

**Performance:** Measure first. Don't add `useMemo`/`useCallback` preemptively. Use FlashList for long lists.

## Design System

Full reference in `docs/coding/DESIGN.md`. Key rules:

- **Spacing:** Tailwind 4pt grid only. No fractional values (`gap-1.5`) unless warranted. No inline styles for static layout.
- **Color:** Theme classes only (`bg-surface`, `text-muted`). `useThemeColors()` only for icon `color` props. No hardcoded hex.
- **Radius:** `rounded-lg` (8px), `rounded-xl` (12px), `rounded-full` (pills/FAB).
- **Typography:** `font-heading` for titles only. `Overline` component for section labels.
- **Icons:** `lucide-react-native`. Sizes: 14–16 inline, 20 nav, 24 primary, 48 empty state.
- **Layout:** Keep positioning in consumers, not in reusable components.
