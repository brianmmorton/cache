# @normalized-cache/react

React hooks for [`@normalized-cache/core`](https://www.npmjs.com/package/@normalized-cache/core) — `useModel` and `useModelAll`, with selector-based rerender control.

## Install

```sh
npm install @normalized-cache/core @normalized-cache/react
```

`react` (>=18) is a peer dependency and must be installed separately in your app.

## Usage

Bind hooks to a specific cache instance once, in your own setup file:

```ts
// models/hooks.ts
import { createCacheHooks } from "@normalized-cache/react";
import { cache } from "./cache"; // your NormalizedCache instance

export const { useModel, useModelAll } = createCacheHooks(cache);
```

Then use them in components:

```tsx
import { useModel, useModelAll } from "./models/hooks";

function UserName({ userId }: { userId: string }) {
  const userName = useModel("User", userId, (user) => user.name);
  return <span>{userName}</span>;
}

function UserList() {
  const names = useModelAll("User", (users) => users.map((u) => u.name));
  return <ul>{names.map((n) => <li key={n}>{n}</li>)}</ul>;
}
```

Selectors are type-safe (derived from the models registered on your cache) and let components re-render only when the selected value actually changes.

## Selector stability

`useModel` and `useModelAll` are built on React's [`useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore), which requires `getSnapshot()` to return a value that is referentially stable (`Object.is`-equal) across calls when nothing has changed. If it doesn't, React re-renders, calls `getSnapshot` again, sees another new reference, and loops forever — this surfaces as `Maximum update depth exceeded` or "The result of getSnapshot should be cached to avoid an infinite loop."

`cache.get()`/`cache.getAll()` already return stable references for unchanged data, but a `selector` that derives a **new array or object on every call** breaks that guarantee even though the underlying data hasn't changed, e.g.:

```ts
// Allocates a new array every render, even when `posts` is unchanged.
const titles = useModel("User", userId, (user) => user.posts.map((p) => p.title));
```

Both hooks guard against this automatically: a selector's return value is compared to its previous return value with a one-level-deep shallow equality check (array elements, or object values, compared with `Object.is`) before deciding whether the component needs to re-render. If the new array/object is shallow-equal to the last one, the previously cached reference is reused, so `getSnapshot` stays stable and no loop occurs. Selectors that already return a stable reference (the entity itself, a primitive, a memoized value) are unaffected — an `Object.is` check still short-circuits first.

This only compares one level deep, matching the behavior of `shallowEqual` in Redux's `react-redux` and Zustand's `useShallow`. A selector returning nested arrays/objects (e.g. `{ posts: user.posts.map(...) }` where `posts` is itself a new array each time) will not be considered equal — structure your selector to return a flat array/object, or compose multiple `useModel`/`useModelAll` calls, if you need to derive nested shapes.

## License

MIT
