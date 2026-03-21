# Clean, Readable TypeScript

An opinionated reference for writing TypeScript that's easy to read, review, and maintain. Each recommendation includes rationale and concrete before/after examples.

---

## 1. Naming

### Variables and functions: `camelCase`

Names should be pronounceable, searchable, and reveal intent. Don't abbreviate.

```ts
// before
const dtaRcrd = fetchUsr(usrNm);
let active = true;

// after
const userRecord = fetchUser(userName);
let isActive = true;
```

### Booleans: prefix with `is`, `has`, `can`, `should`

This makes conditionals read like English.

```ts
// before
if (loading) { ... }
if (error) { ... }
if (admin && edit) { ... }

// after
if (isLoading) { ... }
if (hasError) { ... }
if (isAdmin && canEdit) { ... }
```

### Types, interfaces, classes: `PascalCase`, no `I` prefix

The `I` prefix is a C# convention that modern TypeScript style guides (Google, Microsoft, Airbnb) have moved away from. The type system already distinguishes interfaces from values.

```ts
// before
interface IUserService { ... }
interface IApiResponse { ... }

// after
interface UserService { ... }
interface ApiResponse { ... }
```

### Constants: `CONSTANT_CASE` for true globals

Reserve this for values that are genuinely fixed at the module level. Local constants stay `camelCase`.

```ts
const MAX_RETRY_ATTEMPTS = 3;
const MILLISECONDS_PER_DAY = 86_400_000;

function retry() {
  const delayMs = 1000; // local — camelCase is fine
}
```

### Acronyms: treat as whole words

```ts
// before
loadHTTPURL, XMLParser, getJSONData

// after
loadHttpUrl, XmlParser, getJsonData
```

### Vocabulary: pick one word and stick with it

Mixing synonyms across a codebase creates confusion about whether different names mean different things.

```ts
// before — three names for the same concept
getUserInfo()
fetchUserDetails()
loadUserData()

// after — one term, everywhere
getUser()
```

### Files: `kebab-case`

```
user-service.ts
api-client.ts
auth-middleware.ts
```

---

## 2. Type Design

### Enable strict mode

This is non-negotiable. Without it, TypeScript's safety guarantees are hollow.

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### Prefer union types over enums

Union types produce zero runtime JavaScript, don't require imports, and avoid the key/value duplication that enums introduce.

```ts
// before — generates a runtime object, requires import everywhere
enum Status {
  Pending = "pending",
  Approved = "approved",
  Rejected = "rejected",
}

// after — zero runtime cost, works without imports
type Status = "pending" | "approved" | "rejected";
```

Use enums only when you genuinely need runtime iteration over values.

### Prefer `interface` for object shapes, `type` for everything else

Interfaces get better error messages, support declaration merging, and are slightly faster for the compiler. Use `type` for unions, intersections, mapped types, and primitives.

```ts
// object shape — interface
interface User {
  id: string;
  name: string;
  email: string;
}

// union — type
type Result = Success | Failure;

// utility derivation — type
type UserPreview = Pick<User, "id" | "name">;
```

### Use discriminated unions for state

This eliminates impossible states and gives you exhaustive checking for free.

```ts
// before — optional fields create ambiguity
interface ApiResult {
  status: "success" | "error";
  data?: string;
  error?: Error;
}

// after — each variant is self-contained
type ApiResult =
  | { status: "success"; data: string }
  | { status: "error"; error: Error };

function handle(result: ApiResult) {
  if (result.status === "success") {
    console.log(result.data); // TS knows data exists
  } else {
    console.log(result.error); // TS knows error exists
  }
}
```

### Never use `any`

`any` disables type checking entirely. Use `unknown` when the type is genuinely unknown — it forces you to narrow before use.

```ts
// before
function parse(input: any): any {
  return JSON.parse(input);
}

// after
function parse(input: string): unknown {
  return JSON.parse(input);
}
```

### Avoid type assertions and non-null assertions

These tell the compiler "trust me" and bypass safety. Narrow instead.

```ts
// before
const name = (response as User).name;
const first = items[0]!;

// after
if (isUser(response)) {
  const name = response.name;
}

const first = items[0];
if (first !== undefined) {
  // use first
}
```

### Use utility types to derive, not duplicate

```ts
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// derive related types from the source of truth
type CreateUserInput = Omit<User, "id" | "createdAt">;
type UpdateUserInput = Partial<Pick<User, "name" | "email">>;
type UserSummary = Pick<User, "id" | "name">;
```

### Array syntax: `T[]` for simple types, `Array<T>` for complex ones

```ts
// simple — use shorthand
const names: string[] = [];
const users: User[] = [];

// complex — use generic form for readability
const permissions: Array<"read" | "write" | "execute"> = [];
const matrix: Array<[number, number]> = [];
```

---

## 3. Functions

### Limit to 2 parameters; use an object for 3+

Object parameters are self-documenting at call sites and order-independent.

```ts
// before — what does `true` mean? what's `30`?
createUser("Alice", "alice@example.com", 30, "admin", true);

// after — every argument is labeled
createUser({
  name: "Alice",
  email: "alice@example.com",
  age: 30,
  role: "admin",
  sendWelcomeEmail: true,
});
```

### Always annotate return types on exported functions

Return types serve as an API contract. Without them, a small internal change can accidentally change the public type and break callers silently.

```ts
// before — return type is inferred, fragile
export function getUser(id: string) {
  return db.users.find((u) => u.id === id);
}

// after — return type is an explicit contract
export function getUser(id: string): User | undefined {
  return db.users.find((u) => u.id === id);
}
```

### Use function declarations for named functions, arrows for callbacks

```ts
// named function — declaration
function calculateTotal(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// callback — arrow
const activeUsers = users.filter((user) => user.isActive);
```

### Constrain generics to justify their existence

Every type parameter should appear at least twice (linking input to output). If it only appears once, you probably don't need it.

```ts
// before — T is used once, adds nothing
function log<T>(value: T): void {
  console.log(value);
}

// after — no generic needed
function log(value: unknown): void {
  console.log(value);
}

// good use — T links input to output
function first<T>(items: T[]): T | undefined {
  return items[0];
}
```

---

## 4. Null Handling

### Use optional chaining (`?.`) for safe access

```ts
// before
const city =
  user && user.address && user.address.city ? user.address.city : undefined;

// after
const city = user?.address?.city;
```

### Use nullish coalescing (`??`) for defaults

`??` only triggers on `null` and `undefined`, unlike `||` which also catches `0`, `""`, and `false`.

```ts
// before — bug: treats 0 and "" as missing
const port = config.port || 3000;
const name = user.name || "Anonymous";

// after — only falls back on null/undefined
const port = config.port ?? 3000;
const name = user.name ?? "Anonymous";
```

### Check explicitly, not with truthiness

Implicit truthiness checks conflate `null`, `undefined`, `0`, `""`, and `false`. Be precise about what you're checking.

```ts
// before — what if count is 0?
if (count) {
  renderItems(count);
}

// after — explicit about the condition
if (count !== undefined && count > 0) {
  renderItems(count);
}
```

---

## 5. Error Handling

### Type `catch` errors as `unknown` and narrow

Since anything can be thrown in JavaScript, the `catch` variable is `unknown`. Always narrow before accessing properties.

```ts
try {
  await fetchUser(id);
} catch (error) {
  if (error instanceof Error) {
    logger.error(error.message, { stack: error.stack });
  } else {
    logger.error("Unknown error", { error: String(error) });
  }
}
```

### Throw `Error` instances, never strings

```ts
// before
throw "Something went wrong";
throw { message: "fail" };

// after
throw new Error("Something went wrong");
throw new ValidationError("Email is required", { fields: ["email"] });
```

### Create domain-specific error classes

This lets callers handle different failure modes distinctly.

```ts
class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "AppError";
  }
}

class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly fields: string[],
  ) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}
```

### Preserve error context with `cause`

When wrapping errors, use the `cause` option (ES2022) to preserve the original stack trace.

```ts
try {
  await db.query(sql);
} catch (error) {
  throw new DatabaseError("Query failed", { cause: error });
}
```

### Consider Result types for expected failures

For operations where failure is a normal outcome (validation, parsing), returning a result is often clearer than throwing.

```ts
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function parseConfig(raw: string): Result<Config, ValidationError> {
  // returns a result instead of throwing
}

const result = parseConfig(input);
if (result.ok) {
  startApp(result.value);
} else {
  showErrors(result.error.fields);
}
```

---

## 6. Immutability

### Use `readonly` for properties that shouldn't change

It's compile-time only (zero runtime cost) and documents intent clearly.

```ts
interface User {
  readonly id: string;
  readonly createdAt: Date;
  name: string; // mutable — can be updated
  email: string; // mutable — can be updated
}
```

### Use `readonly` arrays for function parameters

This prevents the function from accidentally mutating the caller's array.

```ts
function getNames(users: readonly User[]): string[] {
  // users.push(...)  — compile error
  // users.sort(...)  — compile error
  return users.map((u) => u.name); // fine — creates new array
}
```

### Use `as const` for literal objects and tuples

```ts
const ROLES = ["admin", "editor", "viewer"] as const;
// type: readonly ["admin", "editor", "viewer"]

type Role = (typeof ROLES)[number];
// type: "admin" | "editor" | "viewer"

const config = {
  apiUrl: "https://api.example.com",
  timeout: 5000,
} as const;
// all properties are readonly with literal types
```

---

## 7. Imports

### Group and order consistently

```ts
// 1. Node built-ins
import fs from "node:fs";
import path from "node:path";

// 2. External packages
import { z } from "zod";
import { eq } from "drizzle-orm";

// 3. Internal (aliased) imports
import { db } from "@/lib/database";
import { logger } from "@/lib/logger";

// 4. Relative imports
import { validateInput } from "../validation";
import { UserSchema } from "./schema";
```

### Prefer named exports over default exports

Named exports are easier to rename across a codebase, prevent accidental mismatches, and give better auto-import support in editors.

```ts
// before — default export
export default class UserService { ... }
import UserService from "./user-service"; // could be named anything

// after — named export
export class UserService { ... }
import { UserService } from "./user-service"; // name is enforced
```

### Use `export type` for type-only exports

This helps bundlers tree-shake properly and makes the boundary between runtime and compile-time code explicit.

```ts
export type { User, UserInput };
export { createUser, deleteUser };
```

### Enforce automatically

Use ESLint's `import/order` rule or `prettier-plugin-organize-imports` so this never requires manual effort.

---

## 8. Code Organization

### Group by feature, not by kind

Feature folders keep related code together. You modify one folder instead of touching files scattered across `models/`, `services/`, `controllers/`.

```
// before — organized by type
src/
  models/user.ts
  models/post.ts
  services/user.ts
  services/post.ts
  controllers/user.ts
  controllers/post.ts

// after — organized by feature
src/
  users/
    user.model.ts
    user.service.ts
    user.controller.ts
    index.ts
  posts/
    post.model.ts
    post.service.ts
    post.controller.ts
    index.ts
```

### Use barrel files to simplify imports

```ts
// src/users/index.ts
export { UserService } from "./user.service";
export { createUser, deleteUser } from "./user.controller";
export type { User, CreateUserInput } from "./user.model";

// consumers import from the feature, not internal files
import { UserService, createUser } from "@/users";
```

### Configure path aliases

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

```ts
// before
import { db } from "../../../../lib/database";

// after
import { db } from "@/lib/database";
```

### Export only the public API

Keep internal helpers unexported. If it doesn't need to be used outside the module, don't export it.

---

## 9. Comments & Documentation

### Explain *why*, not *what*

The code already says what it does. Comments should explain intent, constraints, and non-obvious decisions.

```ts
// bad — restates the code
const retryDelay = 1000; // set retry delay to 1000

// good — explains the reasoning
// Exponential backoff starts at 1s. The API rate-limits at 10 req/s
// and returns 429s without Retry-After headers.
const retryDelay = 1000;
```

### Use JSDoc for public APIs

```ts
/**
 * Calculates total price including tax.
 *
 * @param items - Line items with price and quantity
 * @param taxRate - Tax rate as a decimal (e.g., 0.1 for 10%)
 * @throws {ValidationError} If tax rate is negative
 *
 * @example
 * calculateTotal([{ price: 100, quantity: 2 }], 0.1);
 * // => 220
 */
export function calculateTotal(
  items: LineItem[],
  taxRate: number,
): number { ... }
```

### Delete stale comments immediately

An outdated comment is worse than no comment — it actively misleads. When you change code, review the surrounding comments.

---

## 10. Async Patterns

### Never use `forEach` with async callbacks

`forEach` fires every callback but doesn't await them. The loop completes before any callback finishes.

```ts
// before — callbacks fire and are abandoned
items.forEach(async (item) => {
  await saveItem(item); // not awaited by forEach
});

// after — parallel
await Promise.all(items.map((item) => saveItem(item)));

// after — sequential (when order matters)
for (const item of items) {
  await saveItem(item);
}
```

### Handle promise rejections

Unhandled rejections crash Node processes. Every promise chain should have error handling.

```ts
// fire-and-forget with error handling
void syncInBackground().catch((error) => {
  logger.error("Background sync failed", { error });
});
```

---

## 11. Anti-Patterns to Avoid

| Anti-pattern | Why it's bad | Do this instead |
|---|---|---|
| `any` type | Disables all type checking | `unknown` + narrowing, or generics |
| Type assertions (`as`) | Bypasses the compiler | Type guards and narrowing |
| Non-null assertion (`!`) | Hides potential `undefined` bugs | Explicit null checks |
| `enum` for string sets | Runtime overhead, import required | String union types |
| Stateless utility classes | Unnecessary OOP ceremony | Plain functions |
| `forEach` + `async` | Doesn't await callbacks | `for...of` or `Promise.all` |
| Implicit truthiness checks | Conflates `0`/`""`/`false` with `null` | Explicit comparisons |
| Nested ternaries | Hard to follow | `if/else` or early returns |
| Magic numbers/strings | Intent is invisible | Named constants |
| God functions (50+ lines) | Hard to test and reason about | Extract smaller functions |

---

## Quick Setup Checklist

These are the highest-leverage changes to adopt first.

1. **Enable `strict: true`** in `tsconfig.json` (plus `noUncheckedIndexedAccess`)
2. **Ban `any`** via ESLint's `@typescript-eslint/no-explicit-any`
3. **Require return types** on exported functions via `@typescript-eslint/explicit-module-boundary-types`
4. **Organize imports** automatically with `eslint-plugin-import` or Prettier
5. **Configure path aliases** (`@/*`) in `tsconfig.json`
6. **Use `readonly`** on interface properties that shouldn't change
7. **Adopt named exports** exclusively (ban default exports via ESLint)
8. **Set up Prettier** so formatting is never a code review topic
