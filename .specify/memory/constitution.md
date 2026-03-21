<!--
  Sync Impact Report
  ====================
  Version change: 0.0.0 (template) → 1.0.0
  Modified principles: N/A (initial population)
  Added sections:
    - Principle I: Type-Safe Code Quality
    - Principle II: Testing Standards
    - Principle III: User Experience Consistency
    - Principle IV: Performance Requirements
    - Section: Quality Gates
    - Section: Development Workflow
    - Governance rules
  Removed sections: None
  Templates requiring updates:
    - .specify/templates/plan-template.md — ✅ No changes needed
      (Constitution Check section is already dynamic)
    - .specify/templates/spec-template.md — ✅ No changes needed
      (Success Criteria section already supports perf/UX metrics)
    - .specify/templates/tasks-template.md — ✅ No changes needed
      (Polish phase already covers perf, security, tests)
  Follow-up TODOs: None
-->

# Verso Constitution

## Core Principles

### I. Type-Safe Code Quality

All code MUST be written with strict type safety and clean
architecture. This principle is non-negotiable because type
errors caught at compile time never reach users.

- **MUST** enable `strict: true` and `noUncheckedIndexedAccess`
  in `tsconfig.json`.
- **MUST** use `unknown` instead of `any` — ban `any` via ESLint.
- **MUST** narrow types with type guards; NEVER use `as` or `!`
  assertions as shortcuts.
- **MUST** use discriminated unions to model state and eliminate
  impossible states at the type level.
- **MUST** give each function a single responsibility and keep
  it under 20 lines where practical.
- **MUST** use names that reveal intent, using the domain's
  vocabulary consistently across the codebase.
- **MUST** default to immutability — `readonly` properties,
  `readonly` array parameters, `as const` for literals.
- **MUST** depend on abstractions (interfaces), inject
  dependencies, and prefer composition over inheritance.
- **MUST** fail fast — validate inputs at system boundaries
  before doing work.
- **MUST** use specific, domain-appropriate error classes with
  `{ cause: error }` for wrapping.
- **NEVER** leave commented-out code, stale comments, or dead
  exports in the codebase.

### II. Testing Standards

Every feature MUST be verified by automated tests that provide
confidence in correctness without coupling to implementation
details. Tests are the specification — if a behavior matters,
a test proves it works.

- **MUST** write tests before or alongside implementation for
  all new functionality.
- **MUST** test behavior, not implementation — tests assert
  outcomes observable to users or callers, not internal state.
- **MUST** include contract tests for every public API boundary
  (exported functions, REST endpoints, CLI commands).
- **MUST** include integration tests for cross-module workflows,
  data persistence, and external service interactions.
- **MUST** ensure all tests are independently runnable — no
  shared mutable state, no ordering dependencies.
- **SHOULD** aim for meaningful coverage: every user story's
  acceptance scenarios MUST have corresponding test cases.
- **SHOULD** keep unit tests fast (<100ms each) and integration
  tests isolated via test fixtures or containers.
- **NEVER** mock what you don't own — wrap external dependencies
  behind an interface and mock the interface.
- **NEVER** write tests that pass regardless of implementation
  correctness (tautological tests).

### III. User Experience Consistency

The user interface MUST behave predictably and uniformly across
all features. Consistency reduces cognitive load and builds
user trust.

- **MUST** follow a single design system for all UI components
  — spacing, typography, color, and interaction patterns.
- **MUST** provide immediate, visible feedback for every user
  action (loading states, success confirmations, error messages).
- **MUST** write error messages that explain what went wrong and
  what the user can do about it — never show raw stack traces
  or internal codes.
- **MUST** ensure all interactive elements are keyboard
  accessible and meet WCAG 2.1 AA contrast requirements.
- **MUST** handle edge states explicitly: empty states, loading
  states, error states, and partial-data states.
- **SHOULD** maintain consistent navigation patterns and layout
  structure across all views.
- **SHOULD** preserve user context during errors — never lose
  form data or navigation state on failure.
- **NEVER** introduce a new interaction pattern without
  documenting it in the design system.

### IV. Performance Requirements

Features MUST meet measurable performance targets. Performance
is a feature — degradation is treated as a bug with the same
urgency as functional defects.

- **MUST** define performance budgets before implementation:
  response time targets, bundle size limits, memory ceilings.
- **MUST** measure and validate against budgets in CI — no PR
  merges if a budget is exceeded without documented justification.
- **MUST** target <200ms p95 for API responses and <100ms for
  UI interactions under normal load.
- **MUST** lazy-load non-critical resources and avoid blocking
  the main thread with synchronous computation.
- **SHOULD** profile before optimizing — measure, don't guess.
- **SHOULD** use `Promise.all` for independent async operations
  and streaming for large data sets.
- **SHOULD** set up automated performance regression detection
  (lighthouse CI, load test baselines, bundle size tracking).
- **NEVER** introduce an O(n^2) or worse algorithm without
  documenting the expected data size and justification.
- **NEVER** skip performance validation because "it works fine
  locally" — validate under realistic load.

## Quality Gates

Every pull request MUST pass these gates before merge.
Reviewers are accountable for enforcing them.

- All CI checks pass (lint, type-check, tests, build).
- No `any` types, no type assertions without documented reason.
- Every new public API has JSDoc with `@param`, `@returns`,
  `@throws`, and at least one `@example`.
- Test coverage for new code covers all acceptance scenarios
  from the feature specification.
- No performance budget regressions without documented
  justification and a remediation plan.
- PR is under 400 lines of changed code. Larger changes MUST
  be split into independently reviewable increments.
- Accessibility: new UI elements meet WCAG 2.1 AA.
- Error handling: no silent catches, no thrown strings.

## Development Workflow

Development follows a structured, incremental process that
ensures each delivery is independently valuable and verifiable.

- **MUST** start from a feature specification before writing
  code — no undocumented features.
- **MUST** implement in user-story order (P1 first) so that
  the highest-value slice ships earliest.
- **MUST** validate each user story independently at its
  checkpoint before proceeding to the next.
- **MUST** commit after each completed task or logical group.
- **SHOULD** use feature branches and keep them short-lived
  (< 3 days).
- **SHOULD** run the full test suite locally before pushing.
- **NEVER** merge to main with failing tests.

## Governance

This constitution is the authoritative source for development
standards in the Verso project. It supersedes ad-hoc practices
and informal agreements.

- **Amendments** require: (1) a written proposal documenting
  the change and rationale, (2) review by at least one other
  contributor, and (3) a migration plan for existing code if
  the change is backward-incompatible.
- **Versioning** follows semantic versioning: MAJOR for
  principle removals or redefinitions, MINOR for new principles
  or material expansions, PATCH for clarifications and typos.
- **Compliance review**: all PRs and code reviews MUST verify
  adherence to these principles. Violations MUST be flagged
  and resolved before merge.
- **Complexity justification**: any deviation from these
  principles MUST be documented in the PR description with
  a justification and a plan to converge.
- Refer to `CLAUDE.md` for detailed coding standards and
  `docs/coding/` for language-specific guidance.

**Version**: 1.0.0 | **Ratified**: 2026-03-20 | **Last Amended**: 2026-03-20
