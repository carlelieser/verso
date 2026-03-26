# The Do's and Don'ts of Writing Code Comments

A practical guide for developers who want their comments to help — not hinder — the people reading their code.

---

## Why Comments Matter

Code is read far more often than it is written. Comments, when used well, bridge the gap between what the code *does* and why it *exists*. But comments used poorly become noise, or worse, actively misleading artifacts that erode trust in the codebase.

As Jeff Atwood (co-founder of Stack Overflow) put it: **"Code tells you how; comments tell you why."** That single sentence captures the philosophy behind every guideline in this report.

---

## The Do's

### 1. Explain the "Why," Not the "What"

The single most important rule. Your code already describes *what* is happening — that's what code does. A comment's job is to explain the reasoning, context, or intent that isn't obvious from reading the code itself.

```
// Bad — restates the code
x = x + 1  // increment x by 1

// Good — explains intent
x = x + 1  // compensate for the off-by-one error in the vendor's API response
```

If someone can understand the "what" by reading the code, the comment should answer the "why" or not exist at all.

### 2. Warn About Consequences and Side Effects

Some code has non-obvious consequences. Comments are the right place to flag these, especially when removing or changing the code could cause subtle breakage.

```
// WARNING: This query locks the users table. Do not call during peak hours
// without coordinating with the DBA team.
```

Robert C. Martin, in *Clean Code*, specifically calls out "warning of consequences" as one of the legitimate and valuable uses of comments.

### 3. Clarify Code That Can't Be Simplified Further

Sometimes the problem domain is inherently complex — regular expressions, bitwise operations, mathematical formulas, or optimized algorithms. When you've already made the code as clear as you can and it's still hard to parse, a comment is warranted.

```
// Sieve of Eratosthenes: mark all multiples of each prime as composite,
// starting from p^2 since smaller multiples were already marked by smaller primes.
for i in range(p * p, limit, p):
    is_prime[i] = False
```

### 4. Explain Unidiomatic or Surprising Code

If your code deliberately breaks conventions or does something a reader wouldn't expect, explain why. Without the comment, the next developer may "fix" your intentional choice and introduce a real bug.

```
// We intentionally use a linear scan here instead of a hash lookup.
// The dataset is always < 10 items, and the hash overhead is measurable
// in our profiling benchmarks (see issue #4412).
```

### 5. Link to External References

When code is based on an algorithm from a paper, implements a specification, works around a known bug in a library, or was adapted from a StackOverflow answer, include a link. This gives future readers an entry point for understanding the broader context.

```
// Implements the Luhn algorithm for credit card validation.
// See: https://en.wikipedia.org/wiki/Luhn_algorithm
```

This also applies to copied code — always credit the source and provide a URL so others can understand the original context and check for updates.

### 6. Document Bug Fixes with Context

When fixing a bug, a brief comment explaining what went wrong and why the fix works can save future developers from re-introducing the same issue.

```
// Fix: The previous implementation used insertion order, which caused
// duplicate entries when concurrent requests arrived within the same
// millisecond. Switching to a Set resolves this. (See BUG-2847)
```

### 7. Use TODO, FIXME, and HACK Tags — Responsibly

These tags are widely recognized markers for incomplete or imperfect code. Used well, they make technical debt visible.

- **TODO** — a planned task or enhancement that hasn't been done yet
- **FIXME** — a known bug or broken behavior that needs attention
- **HACK** — a temporary workaround that should eventually be replaced

The key is to include enough context to be actionable: who left it, why, and ideally a link to a tracked issue.

```
// TODO(carlos, #3391): Replace with batch API once v2 endpoint is available.
// Current approach makes N+1 requests.
```

If a TODO doesn't have a corresponding ticket in your issue tracker, it's likely to rot. Create the ticket first, then reference it.

### 8. Write Comments as You Go

Writing comments after the fact is unreliable. You'll forget the reasoning behind decisions, the edge cases you considered, or the tradeoffs you weighed. Capture context while it's fresh.

### 9. Keep a Consistent Style

Whether your team uses Javadoc, JSDoc, docstrings, or a custom convention, consistency matters more than the specific format. Agree on a style and stick to it — it reduces cognitive load and makes automated documentation tools work properly.

---

## The Don'ts

### 1. Don't Restate the Code

This is the most common commenting mistake. If the comment says exactly what the code says, it adds zero information and doubles the maintenance burden.

```
// Bad
account.close()  // close the account

user_count = len(users)  // set user_count to the length of users
```

Every redundant comment is a liability: when the code changes, the comment often doesn't, and then you have a *lying* comment — which is worse than no comment at all.

### 2. Don't Use Comments to Excuse Bad Code

If your code needs a paragraph of explanation to be understood, the first instinct should be to rewrite the code, not to add a comment. As Martin puts it: "Don't comment bad code — rewrite it."

Comments should complement clear code, not serve as a crutch for unclear code. Rename variables, extract functions, simplify conditionals — *then* see if a comment is still needed.

### 3. Don't Leave Commented-Out Code

Commented-out blocks of code are clutter. They raise questions ("Is this needed? Was it disabled for a reason? Is it safe to delete?") without providing answers. Your version control system preserves history — that's its job. Delete the dead code; git has your back.

```
// Bad
// function oldCalculation(x) {
//     return x * 0.15 + LEGACY_TAX_RATE;
// }
function calculateTax(x) {
    return x * currentRate();
}
```

### 4. Don't Rely on Comments for Change History

Before version control was ubiquitous, developers maintained changelogs at the top of files. That practice is now an anti-pattern. Git (or your VCS of choice) tracks who changed what, when, and why — through commits and blame annotations — far more reliably than manually maintained comment headers.

```
// Bad
// 2024-01-15 — Carlos: Fixed null pointer exception
// 2024-02-03 — Sofia: Added retry logic
// 2024-03-22 — James: Refactored to use async
```

This information belongs in commit messages, not in the source file.

### 5. Don't Write Comments Only You Can Understand

Comments riddled with inside jokes, abbreviations without context, or cryptic shorthand are worse than useless to anyone who isn't you — and that includes future-you in six months.

```
// Bad
// do the thing from the meeting

// Good
// Apply the rate adjustment agreed upon in the Q3 pricing review.
// See confluence.example.com/pricing-q3 for the full decision record.
```

### 6. Don't Let Comments Rot

A stale comment that no longer reflects the code is actively harmful. It misleads readers and wastes debugging time. When you change code, update or remove the associated comments. Treat comments as part of the code, not decoration around it.

This is perhaps the strongest argument for writing *fewer* comments: every comment is a maintenance commitment. Only write ones you're willing to keep current.

### 7. Don't Over-Comment

A file drowning in comments is hard to read. When everything is annotated, nothing stands out, and developers learn to skip the comments entirely — defeating the purpose. Comment strategically: focus on the complex, the surprising, and the consequential.

### 8. Don't Use Closing-Brace Comments

Marking the end of long blocks with comments like `// end if` or `// end for` is a sign the function is too long. The real fix is to extract smaller functions, not to add navigation aids to a monolithic block.

```
// Bad
if (condition) {
    // ... 80 lines of code ...
} // end if condition

// Better: extract the body into a well-named function
if (condition) {
    handleCondition();
}
```

---

## A Quick Decision Framework

When you're about to write a comment, run through this checklist:

1. **Can I rename a variable or function to make this obvious?** If yes, do that instead.
2. **Can I extract a method with a descriptive name?** If yes, do that instead.
3. **Does this comment explain *why*, not *what*?** If it only restates the code, delete it.
4. **Will this comment still be true in six months?** If it's fragile or likely to drift from the code, consider whether it's worth the maintenance cost.
5. **Would a new team member benefit from reading this?** If yes, it's probably a good comment.

---

## Summary

| Do | Don't |
|---|---|
| Explain the *why* behind decisions | Restate what the code already says |
| Warn about consequences and side effects | Use comments to excuse unclear code |
| Clarify inherently complex logic | Leave commented-out dead code |
| Flag surprising or unidiomatic choices | Maintain change history in comments |
| Link to external references and sources | Write comments only you understand |
| Document bug fixes with context | Let comments go stale |
| Use TODO/FIXME with tracked issues | Over-comment obvious code |
| Write comments while context is fresh | Use closing-brace comments instead of refactoring |

---

## Further Reading

- *Clean Code* by Robert C. Martin — Chapter 4 covers comments extensively
- [Best Practices for Writing Code Comments](https://stackoverflow.blog/2021/12/23/best-practices-for-writing-code-comments/) — Stack Overflow Blog
- [Do's and Don'ts of Commenting Code](https://blog.openreplay.com/dos-and-donts-of-commenting-code/) — OpenReplay Blog
- [Code Comment Anti-Patterns](https://bytedev.medium.com/code-comment-anti-patterns-and-why-the-comment-you-just-wrote-is-probably-not-needed-919a92cf6758) — ByteDev on Medium
- [Coding and Comment Style](https://mitcommlab.mit.edu/broad/commkit/coding-and-comment-style/) — MIT Communication Lab