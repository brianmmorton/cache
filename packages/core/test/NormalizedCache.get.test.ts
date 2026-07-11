import { describe, expect, it } from "vitest";
import { NormalizedCache } from "../src/NormalizedCache";
import { modelRegistry } from "./fixtures/modelRegistry";

function createCache() {
  return new NormalizedCache(modelRegistry);
}

describe("NormalizedCache.get", () => {
  it("returns undefined for an id that does not exist", () => {
    const cache = createCache();
    expect(cache.get("User", "missing")).toBeUndefined();
  });

  it("returns a denormalized entity for a stored id", () => {
    const cache = createCache();
    cache.set("User", { id: "u1", name: "Ada", email: "ada@example.com" });

    const user = cache.get("User", "u1");
    expect(user?.id).toBe("u1");
    expect(user?.name).toBe("Ada");
    expect(user?.email).toBe("ada@example.com");
  });

  it("exposes hasMany relations as an array via a lazy getter", () => {
    const cache = createCache();
    cache.set("User", {
      id: "u1",
      name: "Ada",
      email: "ada@example.com",
      posts: [
        { id: "p1", title: "First post" },
        { id: "p2", title: "Second post" },
      ],
    } as any);

    const user = cache.get("User", "u1")!;
    expect(user.posts).toHaveLength(2);
    expect(user.posts.map((p) => p.id).sort()).toEqual(["p1", "p2"]);
  });

  it("only computes relationship data when the property is accessed (lazy)", () => {
    const cache = createCache();
    cache.set("User", {
      id: "u1",
      name: "Ada",
      email: "ada@example.com",
      posts: [{ id: "p1", title: "First post" }],
    } as any);

    const descriptor = Object.getOwnPropertyDescriptor(cache.get("User", "u1"), "posts");
    expect(typeof descriptor?.get).toBe("function");
  });

  it("reflects live cache state when a lazily-accessed relation is read after further writes", () => {
    const cache = createCache();
    cache.set("User", {
      id: "u1",
      name: "Ada",
      email: "ada@example.com",
      posts: [{ id: "p1", title: "First post" }],
    } as any);

    const user = cache.get("User", "u1")!;
    cache.set("Post", { id: "p2", userId: "u1", title: "Second post" });

    expect(user.posts.map((p) => p.id).sort()).toEqual(["p1", "p2"]);
  });

  it("exposes an empty array for hasMany relations with no linked children", () => {
    const cache = createCache();
    cache.set("User", { id: "u1", name: "Ada", email: "ada@example.com" });

    const user = cache.get("User", "u1")!;
    expect(user.posts).toEqual([]);
  });

  it("exposes hasOne relations as a single entity or null via a lazy getter", () => {
    const cache = createCache();
    cache.set("User", {
      id: "u1",
      name: "Ada",
      email: "ada@example.com",
      profile: { id: "pr1", bio: "Mathematician" },
    } as any);

    const user = cache.get("User", "u1")!;
    expect(user.profile?.id).toBe("pr1");
    expect(user.profile?.bio).toBe("Mathematician");
  });

  it("exposes null for hasOne relations with no linked child", () => {
    const cache = createCache();
    cache.set("User", { id: "u1", name: "Ada", email: "ada@example.com" });

    const user = cache.get("User", "u1")!;
    expect(user.profile).toBeNull();
  });

  it("exposes belongsTo relations as a single entity or null via a lazy getter", () => {
    const cache = createCache();
    cache.set("User", { id: "u1", name: "Ada", email: "ada@example.com" });
    cache.set("Post", { id: "p1", userId: "u1", title: "First post" });

    const post = cache.get("Post", "p1")!;
    expect(post.author?.id).toBe("u1");
    expect(post.author?.name).toBe("Ada");
  });

  it("exposes null for belongsTo relations whose parent is not cached", () => {
    const cache = createCache();
    cache.set("Post", { id: "p1", userId: "missing-user", title: "Orphaned post" });

    const post = cache.get("Post", "p1")!;
    expect(post.author).toBeNull();
  });
});
