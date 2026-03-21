# Coding Principles

Language-agnostic fundamentals for writing code that's easy to read, change, and trust. Each principle includes rationale, before/after examples, and when it's okay to break the rule.

---

## 1. Naming

### Reveal intent

A name should answer *what* and *why* without requiring the reader to inspect the implementation.

```
// before
function proc(d) {
  let x = d.length
  let y = x * 0.15
  return y
}

// after
function calculateTax(purchaseAmount) {
  const taxRate = 0.15
  return purchaseAmount * taxRate
}
```

### Make names searchable

Avoid magic numbers, single-character names outside tiny scopes, and cryptic abbreviations.

```
// before
const TNVPM = 1440
const maxq = 100

// after
const MINUTES_PER_DAY = 1440
const MAX_QUEUE_SIZE = 100
```

### Use the domain's vocabulary

If the business calls it an "order," call it an order — not a "request object" or "tx record." This eliminates translation overhead between conversations and code.

```
// before
class APIEndpoint {
  processREQ(req) {
    const amt = req.amt
    const rt = calculateRT(amt)
    const rec = { amt, rt, ts: new Date() }
    db.persist(rec)
  }
}

// after
class OrderService {
  processOrder(order) {
    const shippingRate = calculateShippingRate(order.amount)
    const processedOrder = {
      amount: order.amount,
      shippingRate,
      processedAt: new Date(),
    }
    orderRepository.save(processedOrder)
  }
}
```

### Pick one word and stick with it

Mixing `getUserInfo`, `fetchUserDetails`, and `loadUserData` across a codebase makes readers wonder whether these mean different things. They usually don't.

**When to break naming rules:** Short loop variables (`i`, `j`) in small scopes are fine. Greek letters in mathematical domains are fine when they match the paper you're implementing.

---

## 2. Functions

### Single Responsibility

A function should have one reason to change. When it has multiple responsibilities, testing requires you to exercise all paths together, reuse becomes impossible, and debugging one responsibility masks problems in another.

```
// before — does four things
function saveUserAndSendEmail(user, template) {
  if (!user.email || !user.name) throw new Error("Invalid")
  database.save(user)
  emailService.send(user.email, `Welcome, ${user.name}`, template)
  logger.info(`User created: ${user.id}`)
}

// after — each function has one job
function saveUser(user) {
  validateUser(user)
  return database.save(user)
}

function sendWelcomeEmail(user, template) {
  emailService.send(user.email, `Welcome, ${user.name}`, template)
}
```

### Keep functions short

Aim for under 20 lines. When a function is long, it's usually hiding multiple responsibilities behind a vague name like `processData` or `handleRequest`.

```
// before — 50+ lines doing everything
function generateReport(data) { /* validation, sorting, aggregation, formatting, I/O */ }

// after — each step is named and testable
function generateReport(data) {
  const validated = validateReportData(data)
  const sorted = sortByDate(validated)
  const aggregated = aggregateByCategory(sorted)
  const formatted = formatAsTable(aggregated)
  return saveToFile(formatted)
}
```

### Limit parameters

Two parameters or fewer. Beyond that, use an object so arguments are self-documenting and order-independent.

```
// before — what does `true` mean?
createUser("Alice", "alice@co.com", 30, "admin", true)

// after — every argument is labeled
createUser({
  name: "Alice",
  email: "alice@co.com",
  age: 30,
  role: "admin",
  sendWelcomeEmail: true,
})
```

### Prefer pure functions

A pure function always returns the same output for the same input and has no side effects. Pure functions are trivial to test, safe to parallelize, and easy to reason about. Push side effects (I/O, logging, state mutation) to the edges of your system.

```
// before — modifies external state, logs, triggers hidden behavior
let totalCost = 0

function addToCart(item) {
  totalCost += item.price
  console.log("Added: " + item.name)
  if (totalCost > 100) applyDiscount()
  return totalCost
}

// after — pure calculation, side effects at the boundary
function calculateCartTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0)
}

function shouldApplyDiscount(total) {
  return total > 100
}
```

**When to break function rules:** Very small utility functions (under 5 lines) doing cohesive work don't always need decomposition. Performance-critical inner loops may justify longer functions. But question the assumption — usually decomposition helps.

---

## 3. Abstraction and Modularity

### Separation of Concerns

Partition the system so each module handles one concern: UI rendering, business logic, data access, authentication, etc. When concerns are tangled, a change to one ripples through everything.

```
// before — controller does validation, querying, crypto, session management
class UserController {
  login(username, password) {
    if (!username || username.length < 3) return { error: "Invalid" }
    const user = db.query(`SELECT * FROM users WHERE name = '${username}'`)
    const match = bcrypt.compare(password, user.passwordHash)
    if (!match) return response.status(401).json({ error: "Auth failed" })
    session.set("user_id", user.id)
    return { success: true }
  }
}

// after — each layer owns one concern
class UserRepository {
  findByUsername(username) { return db.query("SELECT ... WHERE name = ?", [username]) }
}

class AuthService {
  authenticate(username, password) {
    const user = this.userRepo.findByUsername(username)
    if (!user || !bcrypt.compare(password, user.passwordHash)) return null
    return user
  }
}

class LoginController {
  login(req, res) {
    const user = this.authService.authenticate(req.body.username, req.body.password)
    if (!user) return res.status(401).json({ error: "Auth failed" })
    req.session.userId = user.id
    return res.json({ success: true })
  }
}
```

### Composition over inheritance

Build behavior by combining small, focused pieces rather than extending class hierarchies. Inheritance creates rigid structures where changing a parent breaks all children. Composition lets you mix capabilities freely.

```
// before — rigid hierarchy, can't make a penguin that swims
class Bird extends Animal { move() { return "fly" } }
class Fish extends Animal { move() { return "swim" } }

// after — mix behaviors freely
const penguin = compose(swimming, chirping)
const duck = compose(flying, swimming, quacking)
```

**When to break it:** Shallow inheritance (one level deep) for genuine "is-a" relationships is fine. The problem is deep hierarchies and using inheritance for code reuse.

### Law of Demeter

Talk to your neighbors, not your neighbor's neighbors. Each "reach-through" creates a hidden dependency on internal structure that will break when that structure changes.

```
// before — reaches through three layers
customer.account.orders[0].shipment.status

// after — each object exposes what callers need
customer.getActiveOrderStatus()
```

**When to break it:** Fluent/builder APIs intentionally chain calls (`query.where().select().limit()`), but that's a designed pattern, not an accident.

---

## 4. Error Handling

### Fail fast

Validate assumptions immediately. Throw errors at the point of failure rather than allowing invalid state to propagate downstream where it becomes much harder to diagnose.

```
// before — invalid state silently propagates
function processTransaction(amount, account) {
  const newBalance = account.balance - amount  // what if amount > balance?
  account.balance = newBalance
  charge(account.cardToken, amount)  // charge succeeds, but balance is wrong
}

// after — catches the problem immediately
function processTransaction(amount, account) {
  if (amount <= 0) throw new Error("Amount must be positive")
  if (amount > account.balance) throw new InsufficientFundsError(amount, account.balance)
  // now we know the operation is valid
  account.balance -= amount
  charge(account.cardToken, amount)
}
```

### Use specific errors

Generic errors hide the actual problem. Callers can't distinguish transient failures (network timeout) from permanent ones (user not found), which makes recovery impossible.

```
// before — caller can't distinguish failure modes
throw new Error("Failed to fetch user")

// after — caller can handle each case differently
throw new UserNotFoundError(id)       // permanent — show "not found"
throw new NetworkError("timeout")     // transient — retry
throw new ServerError(500, "down")    // transient — back off
```

### Never catch and ignore

Silently swallowing errors lets problems metastasize. Either handle the error meaningfully, or propagate it with context.

```
// before — the user is never saved, and nobody knows
try { database.save(user) } catch (e) { /* silence */ }

// after — add context and propagate
try {
  database.save(user)
} catch (error) {
  throw new PersistenceError(`Failed to save user ${user.id}`, { cause: error })
}
```

**When to break error rules:** In one-off scripts, generic errors are acceptable. During production emergencies, you might temporarily catch-and-log to keep a system running. But make it temporary.

---

## 5. State and Side Effects

### Default to immutability

Create new values instead of modifying existing ones. Immutable data prevents an entire class of bugs from unintended modifications, makes change detection trivial, and is thread-safe by definition.

```
// before — mutates the original, surprising the caller
function celebrateBirthday(user) {
  user.age++
  return user
}

celebrateBirthday(user)
console.log(user.age) // 31 — the original changed!

// after — returns a new value, original is untouched
function celebrateBirthday(user) {
  return { ...user, age: user.age + 1 }
}

const olderUser = celebrateBirthday(user)
console.log(user.age)      // 30 — unchanged
console.log(olderUser.age)  // 31
```

### Minimize mutable state

Keep state at the periphery. Business logic should be stateless and pure. The fewer places state can change, the fewer places bugs can hide.

**When to break it:** Performance-critical inner loops, very large data structures, or algorithms that are incomprehensible without mutation. But measure first — modern runtimes optimize immutability well. Document when and why you mutate.

---

## 6. Dependencies and Coupling

### Depend on abstractions, not implementations

High-level modules shouldn't know about low-level details. When you depend on an interface rather than a concrete class, you can swap implementations without touching business logic — and testing becomes trivial.

```
// before — hardcoded to Postgres and Gmail
class UserService {
  constructor() {
    this.db = new PostgresDatabase()
    this.email = new GmailService()
  }
}

// after — accepts any implementation that satisfies the interface
class UserService {
  constructor(database, emailService) {
    this.db = database
    this.email = emailService
  }
}

// production
new UserService(new PostgresDatabase(), new GmailService())

// tests
new UserService(new MockDatabase(), new MockEmailService())

// switching databases: change one line, not the whole service
new UserService(new MongoDatabase(), new GmailService())
```

### Reduce coupling

The fewer modules a change touches, the safer it is. Prefer communication through interfaces rather than shared mutable state or internal details.

**When to break it:** Simple scripts and one-off utilities where swappability doesn't matter. But even small modules benefit from loose coupling.

---

## 7. Complexity Management

### Flatten your code with early returns

Deeply nested conditionals are hard to follow. Guard clauses (early returns for invalid cases) eliminate nesting and let the reader focus on the happy path.

```
// before — deeply nested, hard to trace
function isEligible(user) {
  if (user.age >= 18) {
    if (user.income > 30000) {
      if (user.creditScore > 600) {
        if (!user.hasDebt) {
          return true
        }
      }
    }
  }
  return false
}

// after — flat, reads top to bottom
function isEligible(user) {
  if (user.age < 18) return false
  if (user.income <= 30000) return false
  if (user.creditScore <= 600) return false
  if (user.hasDebt) return false
  return true
}
```

### Eliminate magic values

Magic numbers and strings hide intent. Named constants make the code self-documenting and changes single-source.

```
// before
if (response.status === 429) {
  await sleep(86400000)
}

// after
const HTTP_TOO_MANY_REQUESTS = 429
const ONE_DAY_MS = 86_400_000

if (response.status === HTTP_TOO_MANY_REQUESTS) {
  await sleep(ONE_DAY_MS)
}
```

---

## 8. DRY, KISS, YAGNI

### DRY — Don't Repeat Yourself

Every distinct concept should have a single, authoritative representation. Duplicated logic diverges over time: a bug gets fixed in one copy but not the other.

```
// before — same regex in three places
function validateEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) }
function validateUserEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) }
function validateContactEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) }

// after — one source of truth
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
function isValidEmail(email) { return EMAIL_PATTERN.test(email) }
```

**When to break it:** Two pieces of code that *look* similar but serve different domains and might evolve independently. Premature DRY creates coupling between unrelated concepts. The rule of three is a good heuristic: duplicate once is okay, duplicate twice means extract.

### KISS — Keep It Simple

The simplest solution that works is usually the best. Over-engineering wastes time and creates maintenance burden.

```
// before — a class with caching, hooks, and config for a one-liner
class DataTransformer {
  constructor(config) { this.config = config; this.cache = new Map(); this.hooks = [] }
  registerHook(fn) { this.hooks.push(fn) }
  async transform(data) { /* 30 lines of framework */ }
}

// after — a function
function addProcessedFlag(data) {
  return { ...data, processed: true }
}
```

### YAGNI — You Aren't Gonna Need It

Don't build features, abstractions, or flexibility you don't need right now. Anticipated futures rarely materialize, and speculative code adds real maintenance cost today.

```
// before — built for a future that may never arrive
class DataStore {
  constructor() {
    this.data = {}
    this.watchers = []
    this.history = []
    this.encryption = null
    this.replicationServers = []
  }
}

// after — solves today's problem
class DataStore {
  constructor() { this.data = {} }
  get(key) { return this.data[key] }
  set(key, value) { this.data[key] = value }
}
```

**When to break YAGNI:** When the cost of adding something later is genuinely high (e.g., a database schema migration on a table with billions of rows). But this requires evidence, not speculation.

---

## 9. The Principle of Least Astonishment

Code should behave as the reader expects. Follow conventions, use standard patterns, and avoid clever tricks.

```
// surprising — name says "has" (boolean), but it modifies and returns an object
function hasUser(id) {
  const user = database.findById(id)
  user.lastChecked = new Date()  // hidden side effect
  database.save(user)
  return user
}

// surprising — parameter order is backwards from convention
function transfer(destination, source, amount) { ... }

// surprising — modifies and returns the same array
function sortUsers(users) {
  users.sort((a, b) => a.name.localeCompare(b.name))
  return users  // caller's array is now mutated
}
```

```
// expected — name matches behavior
function findUser(id) { return database.findById(id) }

// expected — conventional order
function transfer(source, destination, amount) { ... }

// expected — returns a new array
function sortUsers(users) {
  return [...users].sort((a, b) => a.name.localeCompare(b.name))
}
```

---

## 10. The Human Side

### Code review: what to look for

Reviews should cover correctness, tests, design, performance, readability, and maintainability. Research shows that effectiveness drops sharply after ~400 lines, and most bugs are found in the first 200.

A practical checklist: Does it handle edge cases? Are errors caught? Is it tested? Could it be simpler? Can you understand it in 2 minutes? Will it be easy to change in 6 months?

### The Boy Scout Rule

Leave code better than you found it. When fixing a bug or adding a feature, improve the surrounding code slightly — rename a confusing variable, extract a small function, remove dead code. Every commit is an opportunity to reduce entropy.

This takes 5 minutes but compounds. Teams that practice it gradually improve their codebase without ever scheduling a "refactoring sprint."

**When to break it:** During a production emergency, focus on the fix. Make a follow-up task for cleanup.

### Connascence: a framework for coupling

Two pieces of code are *connascent* if changing one requires changing the other. Some forms are worse than others:

- **Name connascence** (acceptable): two modules agree on a function name.
- **Type connascence** (mild): two modules agree on a parameter type.
- **Position connascence** (worse): caller and callee must agree on argument order.
- **Content connascence** (worst): code depends on another module's internal structure.

The goal isn't to eliminate connascence — that's impossible. It's to prefer weaker forms (name) over stronger ones (content, position).

---

## 11. SOLID in Brief

These five principles are concentrated expressions of the ideas above.

**Single Responsibility (SRP):** One reason to change per module.

**Open/Closed (OCP):** Open for extension, closed for modification. Add behavior through new code, not by editing existing code.

**Liskov Substitution (LSP):** Subtypes must be usable wherever their parent type is expected, without breaking the program. If a subclass overrides a method in a way that violates the parent's contract, it breaks LSP.

**Interface Segregation (ISP):** Don't force clients to depend on methods they don't use. Prefer many small, focused interfaces over one large one.

**Dependency Inversion (DIP):** Depend on abstractions, not implementations.

---

## 12. When to Break the Rules

Context always matters. Here's a rough guide:

| Context | Approach |
|---|---|
| Startup / prototype | Optimize for speed. Accept debt you'll repay. |
| Stable product | Follow principles religiously. Maintainability wins. |
| Legacy code | Boy Scout Rule. Fix locally, don't rewrite. |
| Performance-critical | Accept complexity, mutation, and tight coupling — but isolate and document it. |
| One-off scripts | Ignore most principles. Make it work. |
| Safety-critical | Be paranoid. Add redundant validation. Accept verbosity. |

The meta-rule: understand the principle, understand the cost of violating it, then decide if that cost is worth paying in your specific context. Following rules blindly is as harmful as ignoring them.

---

*Synthesized from Clean Code (Robert C. Martin), Google Engineering Practices, SOLID Principles, and broad community consensus.*