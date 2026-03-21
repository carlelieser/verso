# The Clean React Handbook

A comprehensive guide to writing clean, maintainable React components and JSX — from fundamentals through advanced patterns.

---

## Table of Contents

1. [Component Architecture](#1-component-architecture)
2. [JSX Best Practices](#2-jsx-best-practices)
3. [Hooks Done Right](#3-hooks-done-right)
4. [Component Composition Patterns](#4-component-composition-patterns)
5. [TypeScript with React](#5-typescript-with-react)
6. [State Management](#6-state-management)
7. [Conditional Rendering](#7-conditional-rendering)
8. [Lists and the Key Prop](#8-lists-and-the-key-prop)
9. [Event Handling](#9-event-handling)
10. [Performance Optimization](#10-performance-optimization)
11. [Error Handling](#11-error-handling)
12. [Testing](#12-testing)
13. [Project Structure and Naming](#13-project-structure-and-naming)
14. [React Server Components and Modern Patterns](#14-react-server-components-and-modern-patterns)
15. [Quick Reference Cheatsheet](#15-quick-reference-cheatsheet)

---

## 1. Component Architecture

### Use Function Components Exclusively

Class components are legacy. Every new component should be a function component with hooks. They're simpler to read, easier to test, and fully supported by all modern React features including Server Components.

```jsx
// Clean function component
function UserGreeting({ name, role }) {
  return (
    <div>
      <h2>Welcome back, {name}</h2>
      <span>{role}</span>
    </div>
  );
}
```

### Single Responsibility Principle

Each component should do one thing well. If a component is handling data fetching, form validation, layout, and business logic all at once, it's time to break it apart.

```jsx
// Too much responsibility
function UserDashboard() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => { /* fetch user */ }, []);
  useEffect(() => { /* fetch posts */ }, []);
  useEffect(() => { /* fetch notifications */ }, []);

  return (
    <div>
      {/* 200 lines of mixed rendering logic */}
    </div>
  );
}

// Clean: split into focused components
function UserDashboard() {
  return (
    <div>
      <UserProfile />
      <PostFeed />
      <NotificationPanel />
    </div>
  );
}
```

### Component Size Guideline

There's no hard rule, but if a component exceeds roughly 150–200 lines, it's a signal to look for extraction opportunities. Ask yourself: can any section of this component be named, reused, or tested independently?

### Presentational vs. Container Components

Though this pattern has evolved since the introduction of hooks, the concept still applies. Separate **what things look like** from **how they work**.

```jsx
// Presentational — only concerned with rendering
function UserCard({ name, email, avatarUrl }) {
  return (
    <div className="user-card">
      <img src={avatarUrl} alt={name} />
      <h3>{name}</h3>
      <p>{email}</p>
    </div>
  );
}

// Container — handles data and logic
function UserCardContainer({ userId }) {
  const { data: user, isLoading } = useUser(userId);

  if (isLoading) return <Skeleton />;
  return <UserCard name={user.name} email={user.email} avatarUrl={user.avatar} />;
}
```

---

## 2. JSX Best Practices

### Keep JSX Readable

Move complex logic out of JSX and into variables or helper functions. Your return statement should read almost like a description of the UI.

```jsx
// Hard to read — logic embedded in JSX
function Dashboard({ user }) {
  return (
    <div>
      <h1>
        {user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.email.split("@")[0]}
      </h1>
      {user.notifications.filter((n) => !n.read).length > 0 && (
        <Badge count={user.notifications.filter((n) => !n.read).length} />
      )}
    </div>
  );
}

// Clean — logic extracted
function Dashboard({ user }) {
  const displayName = getDisplayName(user);
  const unreadCount = user.notifications.filter((n) => !n.read).length;

  return (
    <div>
      <h1>{displayName}</h1>
      {unreadCount > 0 && <Badge count={unreadCount} />}
    </div>
  );
}

function getDisplayName(user) {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  return user.email.split("@")[0];
}
```

### Use Fragments to Avoid Extra DOM Nodes

When you need to return sibling elements, use fragments instead of wrapping `<div>`s that add meaningless structure to the DOM.

```jsx
// Unnecessary wrapper
function UserInfo({ name, email }) {
  return (
    <div>
      <span>{name}</span>
      <span>{email}</span>
    </div>
  );
}

// Clean
function UserInfo({ name, email }) {
  return (
    <>
      <span>{name}</span>
      <span>{email}</span>
    </>
  );
}
```

Use the full `<Fragment>` syntax only when you need to pass a `key` prop (such as in lists).

### Self-Close Tags Without Children

```jsx
// Verbose
<Avatar></Avatar>
<input type="text"></input>

// Clean
<Avatar />
<input type="text" />
```

### Multiline JSX and Parentheses

Wrap multiline JSX in parentheses for clarity. Single-element returns can stay on one line.

```jsx
// Single element — fine on one line
return <h1>Hello</h1>;

// Multi-element — use parentheses
return (
  <section>
    <h1>Hello</h1>
    <p>Welcome to the app</p>
  </section>
);
```

### Prop Spreading: Use with Care

Spreading props (`{...props}`) is convenient but can pass unintended attributes to DOM elements or obscure what a component actually receives.

```jsx
// Risky — you don't know what's in props
function Button(props) {
  return <button {...props} />;
}

// Better — destructure what you need, collect the rest deliberately
function Button({ variant, size, children, ...domProps }) {
  const className = `btn btn-${variant} btn-${size}`;
  return (
    <button className={className} {...domProps}>
      {children}
    </button>
  );
}
```

### Avoid Inline Object and Function Creation in JSX

Creating new objects or functions inside JSX causes unnecessary re-renders for child components because the reference changes every render.

```jsx
// Creates a new object every render
<UserCard style={{ margin: 10 }} />

// Creates a new function every render
<Button onClick={() => handleDelete(item.id)} />

// Better: define outside JSX
const cardStyle = { margin: 10 };
const handleItemDelete = useCallback(() => handleDelete(item.id), [item.id]);

<UserCard style={cardStyle} />
<Button onClick={handleItemDelete} />
```

This matters most when the child component is memoized with `React.memo`. If the child doesn't use memo, the performance difference is negligible.

---

## 3. Hooks Done Right

### The Rules — Non-Negotiable

1. **Only call hooks at the top level** of your component or custom hook. Never inside loops, conditions, or nested functions.
2. **Only call hooks from React functions** — components or other custom hooks. Never from plain JavaScript functions.

```jsx
// Broken — conditional hook call
function Profile({ userId }) {
  if (!userId) return null;
  const user = useUser(userId); // React can't track this reliably
  return <p>{user.name}</p>;
}

// Fixed — hook always runs
function Profile({ userId }) {
  const user = useUser(userId);
  if (!userId) return null;
  return <p>{user.name}</p>;
}
```

### useState: Keep It Simple

State should be the minimal data needed to represent your UI. Derive everything you can.

```jsx
// Over-storing — fullName can be derived
const [firstName, setFirstName] = useState("");
const [lastName, setLastName] = useState("");
const [fullName, setFullName] = useState("");

// Clean — derive fullName
const [firstName, setFirstName] = useState("");
const [lastName, setLastName] = useState("");
const fullName = `${firstName} ${lastName}`.trim();
```

Use the functional updater form when the new state depends on the previous state:

```jsx
// Bug-prone in async contexts
setCount(count + 1);

// Safe
setCount((prev) => prev + 1);
```

Group related state into objects when values always change together, but don't over-group unrelated values:

```jsx
// Related values — group them
const [position, setPosition] = useState({ x: 0, y: 0 });

// Unrelated values — keep them separate
const [name, setName] = useState("");
const [age, setAge] = useState(0);
const [isActive, setIsActive] = useState(false);
```

### useReducer: For Complex State Logic

When state transitions involve multiple related values or conditional logic, `useReducer` is clearer than multiple `useState` calls.

```jsx
const initialState = {
  status: "idle",
  data: null,
  error: null,
};

function fetchReducer(state, action) {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, status: "loading", error: null };
    case "FETCH_SUCCESS":
      return { status: "success", data: action.payload, error: null };
    case "FETCH_ERROR":
      return { status: "error", data: null, error: action.payload };
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}

function UserProfile({ userId }) {
  const [state, dispatch] = useReducer(fetchReducer, initialState);

  useEffect(() => {
    dispatch({ type: "FETCH_START" });
    fetchUser(userId)
      .then((data) => dispatch({ type: "FETCH_SUCCESS", payload: data }))
      .catch((err) => dispatch({ type: "FETCH_ERROR", payload: err.message }));
  }, [userId]);

  // state.status drives the UI clearly
}
```

### useEffect: Sync With the Outside World

Effects are for synchronizing your component with external systems — APIs, subscriptions, the DOM, timers. They are not lifecycle methods.

**Always clean up:**

```jsx
useEffect(() => {
  const controller = new AbortController();

  async function fetchData() {
    try {
      const res = await fetch(`/api/users/${id}`, {
        signal: controller.signal,
      });
      const data = await res.json();
      setUser(data);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message);
      }
    }
  }

  fetchData();
  return () => controller.abort();
}, [id]);
```

**Avoid effects for things that don't need them:**

```jsx
// Unnecessary effect — this is just a derivation
useEffect(() => {
  setFilteredItems(items.filter((item) => item.active));
}, [items]);

// Clean — compute during render
const filteredItems = items.filter((item) => item.active);
```

**Be honest about dependencies.** Never suppress the dependency lint rule. If the dependencies look wrong, restructure the code.

### Custom Hooks: Extract and Reuse Logic

Whenever you find yourself writing the same `useState` + `useEffect` combination in multiple components, extract it into a custom hook.

```jsx
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage full or unavailable
    }
  }, [key, value]);

  return [value, setValue];
}

// Usage
function Settings() {
  const [theme, setTheme] = useLocalStorage("theme", "light");
  // ...
}
```

Custom hooks must start with `use` — this is how React knows to enforce the Rules of Hooks.

---

## 4. Component Composition Patterns

### Children Prop: The Simplest Composition

The `children` prop is the most fundamental composition pattern. It lets a parent component wrap arbitrary content.

```jsx
function Card({ title, children }) {
  return (
    <div className="card">
      <h3 className="card-title">{title}</h3>
      <div className="card-body">{children}</div>
    </div>
  );
}

// Usage — Card doesn't need to know what's inside it
<Card title="User Stats">
  <StatRow label="Posts" value={42} />
  <StatRow label="Followers" value={1200} />
</Card>
```

### Compound Components

When multiple components share implicit state and must work together, compound components keep the API clean. Think of `<select>` and `<option>` in HTML.

```jsx
const AccordionContext = createContext();

function Accordion({ children, defaultOpen = null }) {
  const [openId, setOpenId] = useState(defaultOpen);

  const toggle = useCallback((id) => {
    setOpenId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <AccordionContext.Provider value={{ openId, toggle }}>
      <div className="accordion">{children}</div>
    </AccordionContext.Provider>
  );
}

function AccordionItem({ id, title, children }) {
  const { openId, toggle } = useContext(AccordionContext);
  const isOpen = openId === id;

  return (
    <div className="accordion-item">
      <button onClick={() => toggle(id)}>{title}</button>
      {isOpen && <div className="accordion-content">{children}</div>}
    </div>
  );
}

// Clean API for consumers
<Accordion defaultOpen="faq-1">
  <AccordionItem id="faq-1" title="What is React?">
    <p>A library for building user interfaces.</p>
  </AccordionItem>
  <AccordionItem id="faq-2" title="Why hooks?">
    <p>They simplify state and side effects in function components.</p>
  </AccordionItem>
</Accordion>
```

### Render Props

Useful when a component needs to delegate how something is rendered to its consumer. Less common since hooks arrived, but still valuable for certain UI patterns.

```jsx
function MouseTracker({ render }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e) => setPosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return render(position);
}

// Usage
<MouseTracker
  render={({ x, y }) => (
    <p>
      Cursor is at ({x}, {y})
    </p>
  )}
/>
```

In most cases today, you'd prefer a custom hook (`useMousePosition`) over a render prop — but render props still shine for components that need to control **when** and **where** children are rendered.

### Slots Pattern

For components with multiple named content areas, use explicit props instead of relying solely on `children`.

```jsx
function PageLayout({ header, sidebar, children, footer }) {
  return (
    <div className="page-layout">
      <header>{header}</header>
      <aside>{sidebar}</aside>
      <main>{children}</main>
      <footer>{footer}</footer>
    </div>
  );
}

<PageLayout
  header={<NavBar />}
  sidebar={<SideMenu />}
  footer={<FooterLinks />}
>
  <ArticleContent />
</PageLayout>
```

---

## 5. TypeScript with React

### Typing Props

Define props with an interface or type alias. Prefer `interface` for component props because they're extendable and produce clearer error messages.

```tsx
interface UserCardProps {
  name: string;
  email: string;
  avatarUrl?: string; // optional
  role: "admin" | "editor" | "viewer"; // union type
  onEdit: (userId: string) => void;
}

function UserCard({ name, email, avatarUrl, role, onEdit }: UserCardProps) {
  return (
    <div className="user-card">
      {avatarUrl && <img src={avatarUrl} alt={name} />}
      <h3>{name}</h3>
      <p>{email}</p>
      <span className={`badge-${role}`}>{role}</span>
    </div>
  );
}
```

### Skip React.FC

The `React.FC` type implicitly includes `children` and has other quirks. Modern practice is to type props directly.

```tsx
// Avoid
const Button: React.FC<ButtonProps> = ({ label }) => {
  return <button>{label}</button>;
};

// Prefer
function Button({ label }: ButtonProps) {
  return <button>{label}</button>;
}
```

### Typing Hooks

```tsx
// useState with explicit type when it can't be inferred
const [user, setUser] = useState<User | null>(null);

// useRef for DOM elements
const inputRef = useRef<HTMLInputElement>(null);

// useReducer
const [state, dispatch] = useReducer(reducer, initialState);
// TypeScript infers action types from the reducer's signature
```

### Typing Event Handlers

When event handlers are defined inline, TypeScript infers the event type automatically. When extracted, you'll need to annotate:

```tsx
// Inline — type is inferred
<input onChange={(e) => setName(e.target.value)} />

// Extracted — annotate the event type
function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
  setName(e.target.value);
}
<input onChange={handleChange} />
```

Common event types: `React.MouseEvent`, `React.KeyboardEvent`, `React.FormEvent`, `React.ChangeEvent`.

### Generic Components

For reusable components that work with different data shapes:

```tsx
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map((item) => (
        <li key={keyExtractor(item)}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}

// TypeScript infers T from usage
<List
  items={users}
  renderItem={(user) => <span>{user.name}</span>}
  keyExtractor={(user) => user.id}
/>
```

### Discriminated Unions for Variant Props

When a component behaves differently based on a "type" or "variant" prop, use discriminated unions instead of optional props:

```tsx
type NotificationProps =
  | { type: "success"; message: string }
  | { type: "error"; message: string; retryAction: () => void }
  | { type: "loading" };

function Notification(props: NotificationProps) {
  switch (props.type) {
    case "success":
      return <div className="success">{props.message}</div>;
    case "error":
      return (
        <div className="error">
          {props.message}
          <button onClick={props.retryAction}>Retry</button>
        </div>
      );
    case "loading":
      return <Spinner />;
  }
}
```

---

## 6. State Management

### The Decision Framework

Before reaching for a state management library, ask:

1. **Is this state used by only one component?** Use `useState`.
2. **Is it used by a parent and its children?** Lift state up to the common parent.
3. **Is it complex with many transitions?** Use `useReducer`.
4. **Is it needed across distant parts of the tree?** Use Context or a state library.
5. **Is it server data that needs caching and syncing?** Use React Query or SWR.

### Local State First

Most state should live close to where it's used. Don't make something global "just in case."

```jsx
// This state only matters to SearchBar — keep it local
function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <button type="submit">Search</button>
    </form>
  );
}
```

### Context API: For Low-Frequency Global State

Context is ideal for values that change infrequently and are needed broadly — themes, locale, auth status. It's not designed for high-frequency updates.

```jsx
const ThemeContext = createContext();

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
```

### Server State vs. Client State

Treat server data differently from local UI state. Libraries like React Query (TanStack Query) handle caching, background refetching, optimistic updates, and stale-while-revalidate patterns.

```jsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

function UserList() {
  const { data: users, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### When to Reach for a Library

If you need a global client-side store, Zustand is the current community favorite for its simplicity:

```jsx
import { create } from "zustand";

const useCartStore = create((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),
  clearCart: () => set({ items: [] }),
}));

// Usage in any component
function CartBadge() {
  const itemCount = useCartStore((state) => state.items.length);
  return <Badge count={itemCount} />;
}
```

---

## 7. Conditional Rendering

### Early Returns for Guard Clauses

The cleanest pattern for "don't render if X" scenarios. Put them at the top of the component, before any hooks-dependent rendering logic.

```jsx
function AdminPanel({ user }) {
  if (!user) return null;
  if (!user.isAdmin) return <AccessDenied />;

  return (
    <div>
      <h1>Admin Dashboard</h1>
      {/* admin content */}
    </div>
  );
}
```

Note: early returns must come **after** all hook calls to satisfy the Rules of Hooks.

### Ternary for Binary Choices

```jsx
function AuthButton({ isLoggedIn }) {
  return isLoggedIn ? (
    <button onClick={logout}>Log Out</button>
  ) : (
    <button onClick={login}>Log In</button>
  );
}
```

Never nest ternaries — if you need more than one level, use early returns or a lookup.

### Logical AND for Presence

```jsx
function Notifications({ count }) {
  return (
    <div>
      <h2>Dashboard</h2>
      {count > 0 && <Badge count={count} />}
    </div>
  );
}
```

**Watch out for falsy values.** If `count` is `0`, `{count && <Badge />}` renders `0` on screen. Use an explicit boolean: `{count > 0 && <Badge />}`.

### Object Lookup for Multiple Variants

When you have more than two or three cases, a lookup object is cleaner than a chain of ternaries or if/else blocks.

```jsx
const STATUS_COMPONENTS = {
  idle: null,
  loading: <Spinner />,
  success: <SuccessMessage />,
  error: <ErrorMessage />,
};

function StatusDisplay({ status }) {
  return STATUS_COMPONENTS[status] ?? null;
}
```

---

## 8. Lists and the Key Prop

### Always Use Stable, Unique Keys

Keys tell React which items have changed, been added, or been removed. They must be stable (not changing between renders) and unique among siblings.

```jsx
// Correct — using a stable unique ID from data
function TodoList({ todos }) {
  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>
          <TodoItem todo={todo} />
        </li>
      ))}
    </ul>
  );
}
```

### Never Use Array Index as Key (for Dynamic Lists)

Index-based keys cause bugs when items are reordered, inserted, or deleted. React will reuse component instances incorrectly, leading to stale state, mismatched inputs, and broken animations.

```jsx
// Broken — index keys cause state bugs on reorder
{
  items.map((item, index) => <ListItem key={index} item={item} />);
}

// Safe — stable IDs
{
  items.map((item) => <ListItem key={item.id} item={item} />);
}
```

Index keys are acceptable **only** for static lists that never change order (e.g., a fixed navigation menu).

### Generate IDs When Data Doesn't Have Them

If your data truly lacks unique identifiers, generate them once — not on every render.

```jsx
// Generate IDs when data arrives, not during render
const itemsWithIds = rawItems.map((item) => ({
  ...item,
  id: crypto.randomUUID(),
}));
```

---

## 9. Event Handling

### Pass Functions, Don't Call Them

```jsx
// Wrong — calls handleClick immediately during render
<button onClick={handleClick()}>Save</button>

// Correct — passes the function reference
<button onClick={handleClick}>Save</button>

// Correct — wraps in arrow function when you need to pass arguments
<button onClick={() => handleDelete(item.id)}>Delete</button>
```

### Naming Convention

Use `handle` prefix for handler definitions and `on` prefix for props that accept handlers:

```jsx
// Component definition
function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
    </form>
  );
}

// Usage
<SearchBar onSearch={handleSearch} />
```

### Keep Handlers Lean

Extract complex logic from event handlers into separate functions or custom hooks. The handler itself should read like an outline of what happens.

```jsx
// Heavy handler
function handleSubmit(e) {
  e.preventDefault();
  const errors = {};
  if (!formData.name) errors.name = "Required";
  if (!formData.email) errors.email = "Required";
  if (formData.email && !isValidEmail(formData.email))
    errors.email = "Invalid email";
  if (Object.keys(errors).length > 0) {
    setErrors(errors);
    return;
  }
  setIsSubmitting(true);
  try {
    await submitForm(formData);
    navigate("/success");
  } catch (err) {
    setErrors({ form: err.message });
  } finally {
    setIsSubmitting(false);
  }
}

// Cleaner — separate concerns
function handleSubmit(e) {
  e.preventDefault();
  const errors = validateForm(formData);

  if (Object.keys(errors).length > 0) {
    setErrors(errors);
    return;
  }

  submitFormData(formData);
}
```

### Always Use preventDefault Explicitly

Unlike HTML, returning `false` from a React event handler does not prevent default behavior. You must call `e.preventDefault()`:

```jsx
function LoginForm({ onSubmit }) {
  const handleSubmit = (e) => {
    e.preventDefault(); // Required to prevent page reload
    onSubmit(formData);
  };

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

---

## 10. Performance Optimization

### Don't Optimize Prematurely

The number one performance rule: **measure first**. Use React DevTools Profiler to identify actual bottlenecks before adding `React.memo`, `useMemo`, or `useCallback`. Unnecessary memoization adds complexity and can even hurt performance.

### React.memo: Prevent Unnecessary Re-renders

Wrap a component in `React.memo` when it re-renders frequently with the same props and the rendering is expensive.

```jsx
const ExpensiveChart = React.memo(function ExpensiveChart({ data, config }) {
  // Heavy computation and rendering
  return <canvas>{/* ... */}</canvas>;
});
```

`React.memo` does a **shallow comparison** of props. If you pass objects or arrays, make sure their references are stable (via `useMemo` or `useCallback`).

### useMemo: Cache Expensive Calculations

```jsx
function ProductList({ products, filters }) {
  // Only recalculates when products or filters change
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => matchesFilters(p, filters))
      .sort((a, b) => a.price - b.price);
  }, [products, filters]);

  return (
    <ul>
      {filteredProducts.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </ul>
  );
}
```

### useCallback: Stabilize Function References

Primarily useful when passing callbacks to memoized child components:

```jsx
function ParentList({ items }) {
  const handleItemClick = useCallback((id) => {
    // handle click
  }, []);

  return (
    <ul>
      {items.map((item) => (
        <MemoizedItem key={item.id} item={item} onClick={handleItemClick} />
      ))}
    </ul>
  );
}

const MemoizedItem = React.memo(function Item({ item, onClick }) {
  return <li onClick={() => onClick(item.id)}>{item.name}</li>;
});
```

### React Compiler (React 19+)

The React Compiler automatically memoizes components and values at build time, making manual `useMemo` and `useCallback` largely unnecessary in new projects. If you're on React 19+, let the compiler handle optimization and only intervene when profiling reveals an issue.

### Code Splitting with Lazy Loading

Load components only when needed:

```jsx
import { lazy, Suspense } from "react";

const AdminDashboard = lazy(() => import("./AdminDashboard"));
const UserSettings = lazy(() => import("./UserSettings"));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/settings" element={<UserSettings />} />
      </Routes>
    </Suspense>
  );
}
```

### Virtualize Long Lists

For lists with hundreds or thousands of items, render only what's visible using a virtualization library like `@tanstack/react-virtual`:

```jsx
import { useVirtualizer } from "@tanstack/react-virtual";

function VirtualList({ items }) {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ height: 400, overflow: "auto" }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: "absolute",
              top: virtualItem.start,
              height: virtualItem.size,
              width: "100%",
            }}
          >
            {items[virtualItem.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 11. Error Handling

### Error Boundaries for Render Errors

Error boundaries catch JavaScript errors during rendering, in lifecycle methods, and in constructors of the whole tree below them. Use the `react-error-boundary` library to avoid writing class components.

```jsx
import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) => logErrorToService(error, info)}
      onReset={() => {
        // Reset app state if needed
      }}
    >
      <Dashboard />
    </ErrorBoundary>
  );
}
```

### Strategic Boundary Placement

Don't wrap your entire app in a single error boundary. Place them around risky sections so a chart crash doesn't take down the whole page.

```jsx
function Dashboard() {
  return (
    <div className="dashboard">
      <Header /> {/* No boundary — if this crashes, something is very wrong */}
      <ErrorBoundary FallbackComponent={ChartError}>
        <RevenueChart /> {/* Third-party chart library — could fail */}
      </ErrorBoundary>
      <ErrorBoundary FallbackComponent={WidgetError}>
        <ActivityFeed /> {/* External data — could fail */}
      </ErrorBoundary>
    </div>
  );
}
```

### Async Error Handling

Error boundaries don't catch errors in event handlers or async code. Handle those locally.

```jsx
function useAsyncAction() {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(async (asyncFn) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await asyncFn();
      return result;
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { execute, error, isLoading };
}

function DeleteButton({ itemId }) {
  const { execute, error, isLoading } = useAsyncAction();

  const handleDelete = () => {
    execute(() => deleteItem(itemId));
  };

  return (
    <>
      <button onClick={handleDelete} disabled={isLoading}>
        {isLoading ? "Deleting..." : "Delete"}
      </button>
      {error && <p className="error">{error.message}</p>}
    </>
  );
}
```

---

## 12. Testing

### Test User Behavior, Not Implementation

React Testing Library encourages testing from the user's perspective. Find elements by their accessible roles and labels, not by CSS classes or component internals.

```jsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

test("submitting the login form calls onSubmit with credentials", async () => {
  const handleSubmit = jest.fn();
  render(<LoginForm onSubmit={handleSubmit} />);

  await userEvent.type(screen.getByLabelText(/email/i), "test@example.com");
  await userEvent.type(screen.getByLabelText(/password/i), "secret123");
  await userEvent.click(screen.getByRole("button", { name: /log in/i }));

  expect(handleSubmit).toHaveBeenCalledWith({
    email: "test@example.com",
    password: "secret123",
  });
});
```

### Query Priority

Use queries in this order of preference:

1. `getByRole` — most accessible, closest to how users find elements
2. `getByLabelText` — for form fields
3. `getByPlaceholderText` — when label isn't available
4. `getByText` — for non-interactive elements
5. `getByTestId` — last resort

### What to Test

Focus testing effort on components that involve user interaction, business logic, conditional rendering, and integration between components. Don't test implementation details like internal state values or method calls.

Things worth testing: does the component render the right content based on props? Do interactions trigger the right callbacks? Does conditional logic show/hide the right elements? Do forms validate and submit correctly?

Things to skip: whether `useState` was called, the exact number of re-renders, styling details, or internal function calls.

### Arrange-Act-Assert Pattern

```jsx
test("displays error message when submission fails", async () => {
  // Arrange
  const failingSubmit = jest.fn().mockRejectedValue(new Error("Network error"));
  render(<ContactForm onSubmit={failingSubmit} />);

  // Act
  await userEvent.type(screen.getByLabelText(/message/i), "Hello");
  await userEvent.click(screen.getByRole("button", { name: /send/i }));

  // Assert
  expect(await screen.findByText(/network error/i)).toBeInTheDocument();
});
```

---

## 13. Project Structure and Naming

### Folder Organization

Feature-based organization scales better than grouping by type. Keep related files together so you can understand a feature by looking at one folder.

```
src/
├── features/
│   ├── auth/
│   │   ├── login-form.tsx
│   │   ├── login-form.test.tsx
│   │   ├── use-auth.ts
│   │   ├── auth-context.tsx
│   │   └── types.ts
│   ├── dashboard/
│   │   ├── dashboard-page.tsx
│   │   ├── revenue-chart.tsx
│   │   ├── activity-feed.tsx
│   │   └── use-dashboard-data.ts
│   └── settings/
│       ├── settings-page.tsx
│       ├── profile-form.tsx
│       └── notification-preferences.tsx
├── components/          ← shared, reusable UI only
│   ├── button.tsx
│   ├── modal.tsx
│   ├── spinner.tsx
│   └── error-message.tsx
├── hooks/               ← shared custom hooks
│   ├── use-local-storage.ts
│   ├── use-debounce.ts
│   └── use-media-query.ts
├── utils/               ← pure helper functions
│   ├── format-date.ts
│   ├── validate-email.ts
│   └── cn.ts
├── services/            ← API layer
│   ├── api-client.ts
│   └── user-service.ts
├── types/               ← shared TypeScript types
│   └── index.ts
└── app.tsx
```

### Naming Conventions Summary

| Thing | Convention | Example |
|---|---|---|
| Component names | PascalCase | `UserProfile`, `SearchBar` |
| File names | kebab-case | `user-profile.tsx`, `search-bar.tsx` |
| Hooks | camelCase with `use` prefix | `useAuth`, `useLocalStorage` |
| Event handler definitions | `handle` + event | `handleClick`, `handleSubmit` |
| Event handler props | `on` + event | `onClick`, `onSubmit`, `onSearch` |
| Boolean variables/props | `is`/`has`/`should` prefix | `isLoading`, `hasError`, `shouldFetch` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES`, `API_BASE_URL` |
| Utility functions | camelCase, verb-first | `formatDate`, `validateEmail` |
| Type/Interface names | PascalCase | `UserProfile`, `ApiResponse` |
| Context | PascalCase + "Context" | `ThemeContext`, `AuthContext` |

### One Component Per File

Each component gets its own file. Small helper components used exclusively by one parent can live in the same file, but if they grow or get reused, extract them.

### Index Files: Use Sparingly

Barrel files (`index.ts` that re-exports everything) are convenient for imports but can hurt tree-shaking and make debugging harder. Use them for public API boundaries of feature folders, not everywhere.

```ts
// features/auth/index.ts — public API for the auth feature
export { LoginForm } from "./login-form";
export { useAuth } from "./use-auth";
export { AuthProvider } from "./auth-context";
```

---

## 14. React Server Components and Modern Patterns

### Server Components (React 19+)

Server Components run on the server and send rendered HTML to the client. They can access databases, file systems, and APIs directly — without shipping that code to the browser.

```jsx
// This component runs on the server by default (in frameworks like Next.js)
async function ProductPage({ params }) {
  const product = await db.products.findById(params.id);
  const reviews = await db.reviews.findByProduct(params.id);

  return (
    <div>
      <ProductDetails product={product} />
      <ReviewList reviews={reviews} />
      <AddReviewForm productId={params.id} /> {/* This is a Client Component */}
    </div>
  );
}
```

### "use client" Directive

Add `"use client"` at the top of files that need interactivity — state, effects, event handlers, browser APIs. Keep this boundary as low in the tree as possible.

```jsx
"use client";

import { useState } from "react";

function AddToCartButton({ productId }) {
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    setIsAdding(true);
    await addToCart(productId);
    setIsAdding(false);
  };

  return (
    <button onClick={handleAdd} disabled={isAdding}>
      {isAdding ? "Adding..." : "Add to Cart"}
    </button>
  );
}
```

### The Principle: Server by Default

Start with Server Components and only add `"use client"` where interaction is needed. This keeps your JavaScript bundle small and your initial page load fast.

Good candidates for Server Components: pages, layouts, data-heavy displays, static content. Good candidates for Client Components: forms, modals, tooltips, dropdowns, anything with `useState` or `useEffect`.

### Server Actions (React 19+)

Server Actions let you define server-side functions that can be called directly from client components — no API route needed.

```jsx
// actions.ts
"use server";

export async function createPost(formData: FormData) {
  const title = formData.get("title") as string;
  const body = formData.get("body") as string;

  await db.posts.create({ title, body });
  revalidatePath("/posts");
}

// Client component using the action
("use client");

import { createPost } from "./actions";

function NewPostForm() {
  return (
    <form action={createPost}>
      <input name="title" placeholder="Title" required />
      <textarea name="body" placeholder="Write your post..." required />
      <button type="submit">Publish</button>
    </form>
  );
}
```

### useOptimistic (React 19+)

Show optimistic UI updates immediately while an async action completes:

```jsx
"use client";

import { useOptimistic } from "react";
import { toggleLike } from "./actions";

function LikeButton({ isLiked, likeCount }) {
  const [optimisticLike, setOptimisticLike] = useOptimistic(
    { isLiked, likeCount },
    (current, newIsLiked) => ({
      isLiked: newIsLiked,
      likeCount: current.likeCount + (newIsLiked ? 1 : -1),
    })
  );

  const handleLike = async () => {
    const newIsLiked = !optimisticLike.isLiked;
    setOptimisticLike(newIsLiked);
    await toggleLike(newIsLiked);
  };

  return (
    <button onClick={handleLike}>
      {optimisticLike.isLiked ? "♥" : "♡"} {optimisticLike.likeCount}
    </button>
  );
}
```

---

## 15. Quick Reference Cheatsheet

### Do

- Use function components with hooks exclusively
- Keep components small and focused (single responsibility)
- Extract complex logic into custom hooks
- Use TypeScript with strict mode
- Derive state instead of syncing it
- Use stable, unique keys for list items
- Clean up effects (abort controllers, unsubscribe, clear timers)
- Test user behavior, not implementation details
- Use error boundaries around risky UI sections
- Organize code by feature, not by file type
- Measure before optimizing
- Use Server Components by default (React 19+)

### Don't

- Use class components for new code
- Store derived state in `useState`
- Use array indices as keys for dynamic lists
- Nest ternary operators in JSX
- Suppress the exhaustive-deps ESLint rule
- Spread props indiscriminately (`{...props}`)
- Create objects/functions inline in JSX for memoized children
- Wrap everything in a single error boundary
- Use `React.FC` for component typing
- Make state global before it needs to be
- Add `useMemo`/`useCallback` everywhere "just in case"
- Put `"use client"` at the top of every file

### Essential ESLint Rules

- `react-hooks/rules-of-hooks` — enforces the Rules of Hooks
- `react-hooks/exhaustive-deps` — validates effect dependencies
- `react/no-array-index-key` — warns against index keys
- `react/jsx-no-target-blank` — prevents security issues with `target="_blank"`
- `react/no-unstable-nested-components` — catches components defined inside render

---

*Guide compiled March 2026. Based on React 19+ conventions, community best practices, and the official React documentation.*