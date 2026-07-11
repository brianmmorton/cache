import { describe, expect, it } from "vitest";
import { NormalizedCache } from "../src/NormalizedCache";
import { modelRegistry } from "./fixtures/modelRegistry";

function createCache() {
  return new NormalizedCache(modelRegistry);
}

describe("NormalizedCache.getAll", () => {
  it("returns an empty array when no entities are stored for the model", () => {
    const cache = createCache();
    expect(cache.getAll("User")).toEqual([]);
  });

  it("returns all entities for a model, denormalized", () => {
    const cache = createCache();
    cache.set("User", [
      { id: "u1", name: "Ada", email: "ada@example.com" },
      { id: "u2", name: "Bo", email: "bo@example.com" },
    ]);

    const users = cache.getAll("User");
    expect(users).toHaveLength(2);
    expect(users.map((u) => u.id).sort()).toEqual(["u1", "u2"]);
  });

  it("includes lazily-computed relationship data on each entity", () => {
    const cache = createCache();
    cache.set("User", {
      id: "u1",
      name: "Ada",
      email: "ada@example.com",
      posts: [{ id: "p1", title: "First post" }],
    } as any);

    const [user] = cache.getAll("User");
    expect(user?.posts.map((p) => p.id)).toEqual(["p1"]);
  });

  it("does not include entities from other models", () => {
    const cache = createCache();
    cache.set("User", { id: "u1", name: "Ada", email: "ada@example.com" });
    cache.set("Post", { id: "p1", userId: "u1", title: "First post" });

    const users = cache.getAll("User");
    expect(users).toHaveLength(1);
    expect(users[0]?.id).toBe("u1");
  });
});
