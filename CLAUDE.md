# Constitution

## Workflow

1. You MUST read this document fully and thoroughly before starting ANY task.
2. You MUST read the existing codebase to understand existing components for reusability.
3. After implementation, you MUST run `/simplify` skill.
4. You MUST run formatter and linter before committing.
5. Human approval is required before committing ANY changes.

## Communication

- **MUST** prioritize accuracy over agreement — never change a correct assessment because the user pushes back.
- **MUST** state disagreements directly. Do not soften, hedge, or bury corrections in praise.
- **MUST** lead with substance — do not open responses with flattery or affirmation before delivering the actual
  assessment.
- **MUST** treat user opinions ("I think X", "I believe Y") as claims to evaluate, not positions to support.
- **MUST** say "I'm not sure" or "I don't know" when uncertain. Never fabricate agreement or false certainty.
- **MUST** default to critical analysis when reviewing user work — identify weaknesses, gaps, and wrong assumptions
  before strengths.
- **MUST** present multiple valid perspectives when they exist — do not collapse to whichever one the user seems to
  prefer.
- **MUST** maintain independent assessments over long conversations. Do not drift toward the user's positions under
  repeated pressure.
- **SHOULD** earn praise — never say "great question" or "you're absolutely right" as filler.
- **NEVER** reverse a correct answer due to social pressure. If you were right, explain why and hold.

## Naming

- **MUST** use names that reveal intent — a reader should understand purpose without inspecting the implementation.
- **MUST** use the domain's vocabulary — if the business calls it an "order," the code calls it an order.
- **MUST** pick one word for each concept and use it consistently across the codebase.
- **MUST** use `camelCase` for variables, parameters, and functions.
- **MUST** use `PascalCase` for types, interfaces, classes, and components.
- **MUST** use `CONSTANT_CASE` for module-level constants. Local constants stay `camelCase`.
- **MUST** use `kebab-case` for filenames.
- **MUST** prefix booleans with `is`, `has`, `can`, `should`, or `will`.
- **MUST** treat acronyms as whole words: `loadHttpUrl`, not `loadHTTPURL`.
- **MUST** make names searchable — no cryptic abbreviations or unnamed magic values.
- **NEVER** use the `I` prefix on interfaces.
- **NEVER** abbreviate names to save keystrokes — clarity always wins over brevity.

---

## Functions

- **MUST** give each function a single responsibility — one reason to change.
- **MUST** use an options object when a function takes 3 or more parameters.
- **MUST** annotate return types on all exported/public functions.
- **SHOULD** keep functions under 20 lines. If longer, look for hidden responsibilities to extract.
- **SHOULD** prefer pure functions — same input, same output, no side effects.
- **SHOULD** push side effects (I/O, logging, state mutation) to the edges of the system, not into business logic.
- **SHOULD** use function declarations for named functions and arrow functions for callbacks.
- **SHOULD** use guard clauses (early returns) to flatten nested conditionals.
- **NEVER** let a function name lie about what it does — if it has side effects, the name must reflect that.

---

## Type System (TypeScript)

- **MUST** enable `strict: true` and `noUncheckedIndexedAccess` in `tsconfig.json`.
- **MUST** use `unknown` instead of `any` when the type is genuinely unknown.
- **MUST** narrow types with type guards instead of bypassing the compiler with assertions.
- **MUST** use discriminated unions to model state — eliminate impossible states at the type level.
- **MUST** use `interface` for object shapes and `type` for unions, intersections, and utility derivations.
- **MUST** derive related types from a single source of truth using `Pick`, `Omit`, `Partial`, etc.
- **MUST** use `export type` for type-only exports.
- **SHOULD** prefer string union types over enums — zero runtime cost, no import required.
- **SHOULD** use `T[]` for simple array types and `Array<T>` for complex ones (unions, tuples).
- **SHOULD** constrain every generic type parameter — if it appears only once, you probably don't need it.
- **NEVER** use `any`. Ban it via ESLint.
- **NEVER** use type assertions (`as`) or non-null assertions (`!`) as a shortcut around proper narrowing.

---

## Null Handling

- **MUST** use nullish coalescing (`??`) for default values, not `||` (which falsely triggers on `0`, `""`, `false`).
- **MUST** use optional chaining (`?.`) for safe property access.
- **MUST** check values explicitly — don't rely on implicit truthiness when `0`, `""`, or `false` are valid.
- **NEVER** assume a value is non-null without narrowing first.

---

## Error Handling

- **MUST** fail fast — validate inputs at system boundaries and function entry points before doing any work.
- **MUST** use specific, domain-appropriate error classes so callers can distinguish transient from permanent failures.
- **MUST** narrow caught errors before accessing properties (errors are `unknown`).
- **MUST** preserve error context when wrapping — use `{ cause: error }`.
- **SHOULD** create a hierarchy of domain-specific error classes (`NotFoundError`, `ValidationError`, etc.).
- **SHOULD** consider Result types (`{ ok, value } | { ok, error }`) for operations where failure is a normal outcome.
- **NEVER** throw strings, numbers, or plain objects — always throw `Error` instances.
- **NEVER** catch an error and silently ignore it. Either handle it meaningfully or propagate with context.

---

## State and Immutability

- **MUST** default to immutability — create new values instead of modifying existing ones.
- **MUST** mark properties `readonly` when they shouldn't change after initialization.
- **MUST** use `readonly` array types for function parameters that shouldn't mutate the caller's data.
- **SHOULD** use `as const` for literal configuration objects and fixed sets of values.
- **SHOULD** keep mutable state at the periphery of the system — business logic should be stateless.
- **NEVER** mutate function arguments without the caller explicitly opting in.

---

## Dependencies and Coupling

- **MUST** depend on abstractions (interfaces), not concrete implementations.
- **MUST** inject dependencies rather than hardcoding them — this is what makes code testable.
- **SHOULD** prefer composition over inheritance. Use inheritance only for shallow, genuine "is-a" relationships.
- **SHOULD** follow the Law of Demeter — talk to your neighbors, not your neighbor's neighbors.
- **SHOULD** prefer weaker forms of connascence (name) over stronger forms (position, content).
- **NEVER** reach through multiple layers of objects to access internal state.

---

## Imports and Modules

- **MUST** group imports in order: node built-ins → external packages → internal (aliased) → relative.
- **MUST** use named exports exclusively. Ban default exports.
- **MUST** configure path aliases (`@/*`) to eliminate deep relative import chains.
- **SHOULD** use barrel files (`index.ts`) to expose a feature's public API and hide internal structure.
- **SHOULD** organize code by feature, not by kind (e.g., `users/` not `models/` + `services/` + `controllers/`).
- **SHOULD** enforce import ordering automatically via ESLint or Prettier.
- **NEVER** export internal helpers that aren't part of the module's public API.

---

## Comments and Documentation

- **MUST** explain *why*, not *what* — the code already shows what it does.
- **MUST** use JSDoc with `@param`, `@returns`, `@throws`, and `@example` on all public APIs.
- **MUST** delete stale comments immediately — an outdated comment is worse than no comment.
- **SHOULD** document workarounds, business logic constraints, and non-obvious design decisions.
- **NEVER** leave commented-out code in the codebase — that's what version control is for.

---

## Async Patterns

- **MUST** handle every promise rejection — unhandled rejections crash Node processes.
- **MUST** use `for...of` (sequential) or `Promise.all` (parallel) for async iteration.
- **NEVER** use `forEach` with async callbacks — it doesn't await them.

---

## Complexity

- **MUST** replace magic numbers and strings with named constants.
- **MUST** flatten deeply nested code with guard clauses and early returns.
- **SHOULD** keep cyclomatic and cognitive complexity low — if a function needs a flowchart to follow, split it.
- **SHOULD** start with the simplest solution that works (KISS). Add complexity only when a real requirement demands it.
- **NEVER** build features, abstractions, or flexibility you don't need today (YAGNI).

---

## DRY

- **MUST** give every distinct concept a single, authoritative representation.
- **SHOULD** apply the rule of three: duplicating once is tolerable, duplicating twice means extract.
- **NEVER** apply DRY prematurely between unrelated domains — similar-looking code that serves different purposes and
  evolves independently should stay separate.

---

## Code Review and Teamwork

- **MUST** keep pull requests under 400 lines of changed code — review effectiveness drops sharply beyond this.
- **MUST** leave code better than you found it (Boy Scout Rule) — rename a confusing variable, remove dead code, extract
  a function.
- **SHOULD** review for correctness, tests, design, performance, readability, and maintainability.
- **SHOULD** set up Prettier so formatting is never a code review topic.
- **NEVER** let a PR through without checking edge cases, error handling, and test coverage.

---

## Tooling (First-Day Setup)

- **MUST** enable `strict: true` in `tsconfig.json`.
- **MUST** ban `any` via `@typescript-eslint/no-explicit-any`.
- **MUST** require explicit return types on exported functions via `@typescript-eslint/explicit-module-boundary-types`.
- **MUST** set up Prettier with a shared config.
- **SHOULD** enforce import ordering via `eslint-plugin-import` or `prettier-plugin-organize-imports`.
- **SHOULD** ban default exports via ESLint.
- **SHOULD** configure path aliases (`@/*`) in `tsconfig.json`.

## React Components

- **MUST** use function components exclusively — class components are legacy.
- **MUST** give each component a single responsibility — if it handles data fetching, validation, layout, and business
  logic, split it.
- **MUST** call hooks at the top level only — never inside loops, conditions, or nested functions.
- **MUST** call hooks only from React functions (components or custom hooks), never from plain functions.
- **MUST** be honest about `useEffect` dependencies — never suppress the `exhaustive-deps` lint rule.
- **MUST** clean up effects (abort controllers, unsubscribe, clear timers).
- **MUST** use stable, unique keys for list items from data IDs.
- **MUST** type props with `interface` — do not use `React.FC`.
- **MUST** use discriminated unions for variant props instead of optional props.
- **SHOULD** keep components under 150–200 lines — look for extraction opportunities beyond that.
- **SHOULD** separate presentational components (what it looks like) from container components (how it works).
- **SHOULD** extract complex JSX logic into variables or helper functions — the return statement should read like a UI
  description.
- **SHOULD** use fragments (`<>`) to avoid unnecessary wrapper DOM nodes.
- **SHOULD** destructure props explicitly and collect the rest deliberately — avoid indiscriminate `{...props}`
  spreading.
- **SHOULD** derive state instead of syncing it — if a value can be computed from existing state, compute it during
  render.
- **SHOULD** use the functional updater form for `useState` when new state depends on previous state.
- **SHOULD** use `useReducer` when state transitions involve multiple related values or conditional logic.
- **SHOULD** use `useEffect` only for syncing with external systems — not for derivations or transformations.
- **SHOULD** extract repeated `useState` + `useEffect` patterns into custom hooks (prefixed with `use`).
- **SHOULD** prefer custom hooks over render props for logic reuse; use render props only when controlling render
  placement.
- **SHOULD** keep state local until it needs to be shared — don't make something global "just in case."
- **SHOULD** use Context for low-frequency global state (theme, locale, auth) — not for high-frequency updates.
- **SHOULD** measure before optimizing — use React DevTools Profiler to identify actual bottlenecks before adding
  `React.memo`, `useMemo`, or `useCallback`.
- **SHOULD** place error boundaries around risky UI sections, not a single boundary around the entire app.
- **SHOULD** use `handle` prefix for handler definitions and `on` prefix for props that accept handlers.
- **SHOULD** use early returns for guard clauses after all hook calls.
- **SHOULD** use object lookups instead of ternary chains for multiple rendering variants.
- **SHOULD** test user behavior (accessible roles, labels) not implementation details (internal state, re-render
  counts).
- **SHOULD** use query priority: `getByRole` → `getByLabelText` → `getByPlaceholderText` → `getByText` → `getByTestId`.
- **NEVER** use array index as key for dynamic lists — causes state bugs on reorder.
- **NEVER** nest ternary operators in JSX.
- **NEVER** store derived state in `useState` — compute it during render instead.
- **NEVER** create objects or functions inline in JSX when passing to memoized children — define them outside or use
  `useMemo`/`useCallback`.
- **NEVER** use `forEach` with async callbacks in React effects or handlers — it doesn't await them.

---

## React State Management

- **MUST** follow this decision framework: single component → `useState`; parent + children → lift state up; complex
  transitions → `useReducer`; distant tree access → Context or state library; server data → React Query/SWR.
- **SHOULD** treat server state differently from client UI state — use caching libraries (React Query) for server data.
- **SHOULD** memoize Context values with `useMemo` to prevent unnecessary re-renders.
- **SHOULD** throw from context hooks when used outside their provider.
- **NEVER** reach for a state management library before trying local state and lifting.

---

## React Performance

- **MUST** measure before optimizing — profile first, then act.
- **SHOULD** use `React.memo` only when a component re-renders frequently with unchanged props and rendering is
  expensive.
- **SHOULD** stabilize object/function references with `useMemo`/`useCallback` when passing to `React.memo` children.
- **SHOULD** use virtualization (`@tanstack/react-virtual` or `FlashList`) for lists with hundreds+ items.
- **SHOULD** use lazy loading (`React.lazy` + `Suspense`) for route-level code splitting.
- **SHOULD** let the React Compiler handle memoization on React 19+ — only intervene when profiling reveals an issue.
- **NEVER** add `useMemo`/`useCallback` everywhere "just in case" — unnecessary memoization adds complexity.

---

## React Project Structure

- **MUST** organize code by feature, not by file type.
- **MUST** use one component per file — small helpers used exclusively by one parent may colocate.
- **MUST** use `kebab-case` for file names, `PascalCase` for component names.
- **MUST** use `camelCase` with `use` prefix for custom hooks.
- **SHOULD** use barrel files (`index.ts`) only for public API boundaries of feature folders.
- **SHOULD** colocate tests next to their source files.

---

## Design Consistency

Refer to @docs/coding/DESIGN.md for the full design system.

- **MUST** use Tailwind's 4pt grid for all spacing. No fractional values (`gap-1.5`, `px-2.5`).
- **MUST** use Tailwind theme classes for color (`bg-surface`, `text-muted`, `border-border`). Reserve
  `useThemeColors()` for icon `color` props only.
- **MUST** use Tailwind classes over inline `style={{}}` for any static layout property. Inline styles are for dynamic
  values only (safe area insets, animations).
- **MUST** keep layout concerns (positioning, margins) in the consumer, not baked into reusable components.
- **MUST** use the `Overline` component for uppercase section labels.
- **NEVER** hardcode hex color values. Add missing colors to `global.css`.
- **NEVER** introduce spacing, radius, or font size values outside the defined scales without documented justification.

