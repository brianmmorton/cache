import { describe, expect, it } from "vitest";
import { NormalizedCache } from "../src/NormalizedCache";
import { modelRegistry } from "./fixtures/modelRegistry";

function createCache() {
  return new NormalizedCache(modelRegistry);
}

describe("NormalizedCache.set", () => {
  it("stores a single entity keyed by modelName and id", () => {
    const cache = createCache();

    cache.set("User", { id: "u1", name: "Ada", email: "ada@example.com" });

    const state = cache.getState();
    expect(state.User.u1).toEqual({ id: "u1", name: "Ada", email: "ada@example.com" });
  });

  it("stores an array of entities in one call", () => {
    const cache = createCache();

    cache.set("User", [
      { id: "u1", name: "Ada", email: "ada@example.com" },
      { id: "u2", name: "Bo", email: "bo@example.com" },
    ]);

    const state = cache.getState();
    expect(Object.keys(state.User)).toEqual(["u1", "u2"]);
  });

  it("shallow-merges partial updates with existing cached data", () => {
    const cache = createCache();

    cache.set("User", { id: "u1", name: "Ada", email: "ada@example.com" });
    cache.set("User", { id: "u1", name: "Ada Lovelace" } as any);

    const state = cache.getState();
    expect(state.User.u1).toEqual({
      id: "u1",
      name: "Ada Lovelace",
      email: "ada@example.com",
    });
  });

  it("normalizes hasMany children into the child model's table with the foreign key applied", () => {
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

    const state = cache.getState();
    expect(state.Post.p1).toEqual({ id: "p1", title: "First post", userId: "u1" });
    expect(state.Post.p2).toEqual({ id: "p2", title: "Second post", userId: "u1" });
    // the parent's own table entry should not retain the raw nested array
    expect((state.User.u1 as any).posts).toBeUndefined();
  });

  it("removes hasMany children that were previously linked but are missing from the new payload", () => {
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

    cache.set("User", {
      id: "u1",
      name: "Ada",
      email: "ada@example.com",
      posts: [{ id: "p1", title: "First post" }],
    } as any);

    const state = cache.getState();
    expect(state.Post.p1).toBeDefined();
    expect(state.Post.p2).toBeUndefined();
  });

  it("does not remove children belonging to a different parent when updating hasMany", () => {
    const cache = createCache();

    cache.set("User", [
      {
        id: "u1",
        name: "Ada",
        email: "ada@example.com",
        posts: [{ id: "p1", title: "Ada's post" }],
      },
      {
        id: "u2",
        name: "Bo",
        email: "bo@example.com",
        posts: [{ id: "p2", title: "Bo's post" }],
      },
    ] as any);

    // Update u1's posts, dropping p1 - should not touch p2 (owned by u2)
    cache.set("User", {
      id: "u1",
      name: "Ada",
      email: "ada@example.com",
      posts: [],
    } as any);

    const state = cache.getState();
    expect(state.Post.p1).toBeUndefined();
    expect(state.Post.p2).toEqual({ id: "p2", title: "Bo's post", userId: "u2" });
  });

  it("stores hasOne children separately and removes any previous child from the same parent", () => {
    const cache = createCache();

    cache.set("User", {
      id: "u1",
      name: "Ada",
      email: "ada@example.com",
      profile: { id: "pr1", bio: "Mathematician" },
    } as any);

    let state = cache.getState();
    expect(state.Profile.pr1).toEqual({ id: "pr1", bio: "Mathematician", userId: "u1" });

    cache.set("User", {
      id: "u1",
      name: "Ada",
      email: "ada@example.com",
      profile: { id: "pr2", bio: "Computer scientist" },
    } as any);

    state = cache.getState();
    expect(state.Profile.pr1).toBeUndefined();
    expect(state.Profile.pr2).toEqual({
      id: "pr2",
      bio: "Computer scientist",
      userId: "u1",
    });
  });

  it("does not notify subscribers when a write does not change any entity fields", () => {
    const cache = createCache();
    cache.set("User", { id: "u1", name: "Ada", email: "ada@example.com" });

    let notifyCount = 0;
    cache.subscribe(() => {
      notifyCount += 1;
    });

    cache.set("User", { id: "u1", name: "Ada", email: "ada@example.com" });

    expect(notifyCount).toBe(0);
  });

  it("notifies subscribers when a write changes entity fields", () => {
    const cache = createCache();
    cache.set("User", { id: "u1", name: "Ada", email: "ada@example.com" });

    let notifyCount = 0;
    cache.subscribe(() => {
      notifyCount += 1;
    });

    cache.set("User", { id: "u1", name: "Ada Lovelace" } as any);

    expect(notifyCount).toBeGreaterThan(0);
  });

  it("suppresses subscriber notifications when writeWithoutBroadcast is true", () => {
    const cache = createCache();
    cache.set("User", { id: "u1", name: "Ada", email: "ada@example.com" });

    let notifyCount = 0;
    cache.subscribe(() => {
      notifyCount += 1;
    });

    cache.set(
      "User",
      { id: "u1", name: "Ada Lovelace" } as any,
      { writeWithoutBroadcast: true },
    );

    expect(notifyCount).toBe(0);
    expect(cache.getState().User.u1).toEqual({
      id: "u1",
      name: "Ada Lovelace",
      email: "ada@example.com",
    });
  });
});
