# normalized-cache

A typed, normalized entity cache for web apps, built on [valtio](https://github.com/pmndrs/valtio) for reactivity. Define models, register relationships between them, and read/write normalized data with a small, type-safe API.

Two packages, in this pnpm workspace:

- [`@normalized-cache/core`](packages/core) — `Model`, relationships, and `NormalizedCache`. Framework-agnostic.
- [`@normalized-cache/react`](packages/react) — `createCacheHooks` for `useModel`/`useModelAll` React hooks bound to a cache instance.

## Install

```sh
npm install @normalized-cache/core
npm install @normalized-cache/react  # optional, for React hooks
```

## Defining models

Each model lives in its own file:

```ts
// models/UserModel.ts
import { Model } from "@normalized-cache/core";
import type { PostModelType } from "./PostModel";

export interface UserModelType {
  id: string;
  name: string;
  email: string;
}

export interface UserRelations {
  posts: PostModelType[];
}

export const UserModel = new Model<UserModelType, UserRelations>("User");
```

```ts
// models/PostModel.ts
import { Model } from "@normalized-cache/core";
import type { UserModelType } from "./UserModel";

export interface PostModelType {
  id: string;
  userId: string;
  title: string;
}

export interface PostRelations {
  author: UserModelType | null;
}

export const PostModel = new Model<PostModelType, PostRelations>("Post");
```

Relationships are registered separately, once all models exist:

```ts
// models/registerRelationships.ts
import { UserModel } from "./UserModel";
import { PostModel } from "./PostModel";

UserModel.hasMany(PostModel, { foreignKey: "userId", as: "posts" });
PostModel.belongsTo(UserModel, { foreignKey: "userId", as: "author" });
```

## Creating the cache

```ts
// models/cache.ts
import { NormalizedCache } from "@normalized-cache/core";
import "./registerRelationships";
import { UserModel } from "./UserModel";
import { PostModel } from "./PostModel";

export const cache = new NormalizedCache({
  User: UserModel,
  Post: PostModel,
});
```

## Reading and writing

```ts
cache.set("User", {
  id: "u1",
  name: "Ada",
  email: "ada@example.com",
  posts: [{ id: "p1", title: "Hello world" }], // normalized into the Post table automatically
});

const user = cache.get("User", "u1");
user?.name;              // "Ada"
user?.posts;             // lazily-computed getter -> Post[]

const allUsers = cache.getAll("User"); // denormalized User[]

cache.delete("Post", "p1");
cache.clear();   // empties every model table
cache.dispose(); // removes all subscribers

// Write without notifying subscribers (e.g. inside a listener, to avoid loops):
cache.set("User", { id: "u1", name: "Ada Lovelace" }, { writeWithoutBroadcast: true });
```

`set` accepts a single entity or an array. Partial updates merge shallowly with the existing cached entity. `hasMany`/`hasOne` children nested in a write are normalized into their own model table with the foreign key applied, and any previously-linked children missing from the new payload are removed.

## React hooks

```tsx
// models/hooks.ts
import { createCacheHooks } from "@normalized-cache/react";
import { cache } from "./cache";

export const { useModel, useModelAll } = createCacheHooks(cache);
```

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

Selectors are type-safe and let components re-render only when the selected value changes.

## Development

```sh
pnpm install
pnpm test        # run all unit tests
pnpm typecheck    # typecheck all packages (src + tests)
pnpm build       # build both packages with tsup (ESM + CJS + .d.ts)
pnpm lint        # eslint
```
