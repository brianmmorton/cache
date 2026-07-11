import { describe, expect, it } from "vitest";
import { NormalizedCache } from "../src/NormalizedCache";
import { modelRegistry } from "./fixtures/modelRegistry";

function createCache() {
  return new NormalizedCache(modelRegistry);
}

describe("NormalizedCache.clear", () => {
  it("removes all entities from every model table", () => {
    const cache = createCache();
    cache.set("User", { id: "u1", name: "Ada", email: "ada@example.com" });
    cache.set("Post", { id: "p1", userId: "u1", title: "First post" });

    cache.clear();

    expect(cache.getAll("User")).toEqual([]);
    expect(cache.getAll("Post")).toEqual([]);
  });

  it("allows writing new data after clearing", () => {
    const cache = createCache();
    cache.set("User", { id: "u1", name: "Ada", email: "ada@example.com" });
    cache.clear();

    cache.set("User", { id: "u2", name: "Bo", email: "bo@example.com" });

    expect(cache.get("User", "u2")?.name).toBe("Bo");
  });
});
