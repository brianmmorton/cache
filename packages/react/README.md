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

## License

MIT
