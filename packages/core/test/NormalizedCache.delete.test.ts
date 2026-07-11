import { describe, expect, it } from "vitest";
import { NormalizedCache } from "../src/NormalizedCache";
import { modelRegistry } from "./fixtures/modelRegistry";

function createCache() {
  return new NormalizedCache(modelRegistry);
}

describe("NormalizedCache.delete", () => {
  it("removes an entity by model and id", () => {
    const cache = createCache();
    cache.set("User", { id: "u1", name: "Ada", email: "ada@example.com" });

    cache.delete("User", "u1");

    expect(cache.get("User", "u1")).toBeUndefined();
  });

  it("is a no-op when the id does not exist", () => {
    const cache = createCache();
    expect(() => cache.delete("User", "missing")).not.toThrow();
  });

  it("does not remove entities from other models", () => {
    const cache = createCache();
    cache.set("User", { id: "u1", name: "Ada", email: "ada@example.com" });
    cache.set("Post", { id: "p1", userId: "u1", title: "First post" });

    cache.delete("User", "u1");

    expect(cache.get("Post", "p1")).toBeDefined();
  });

  it("no longer surfaces a deleted hasMany child when reading the parent", () => {
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

    cache.delete("Post", "p1");

    const user = cache.get("User", "u1")!;
    expect(user.posts.map((p) => p.id)).toEqual(["p2"]);
  });

  it("no longer surfaces a deleted hasOne child when reading the parent", () => {
    const cache = createCache();
    cache.set("User", {
      id: "u1",
      name: "Ada",
      email: "ada@example.com",
      profile: { id: "pr1", bio: "Mathematician" },
    } as any);

    cache.delete("Profile", "pr1");

    const user = cache.get("User", "u1")!;
    expect(user.profile).toBeNull();
  });

  it("clears the belongsTo reference when the parent is deleted", () => {
    const cache = createCache();
    cache.set("User", { id: "u1", name: "Ada", email: "ada@example.com" });
    cache.set("Post", { id: "p1", userId: "u1", title: "First post" });

    cache.delete("User", "u1");

    const post = cache.get("Post", "p1")!;
    expect(post.author).toBeNull();
  });
});
