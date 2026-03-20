# Code Standards

Synthesized from our TypeScript guide and general coding principles. Every statement is classified as **MUST** (
non-negotiable), **SHOULD** (strong default, break with documented reason), or **NEVER** (no exceptions in normal
development).

Refer to documentation @docs/coding.

---

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