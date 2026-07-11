import { describe, expect, it } from "vitest";
import { NormalizedCache } from "../src/NormalizedCache";
import { modelRegistry } from "./fixtures/modelRegistry";

function createCache() {
  return new NormalizedCache(modelRegistry);
}

describe("NormalizedCache.subscribe", () => {
  it("invokes the callback when cache state changes", () => {
    const cache = createCache();
    let callCount = 0;
    cache.subscribe(() => {
      callCount += 1;
    });

    cache.set("User", { id: "u1", name: "Ada", email: "ada@example.com" });

    expect(callCount).toBeGreaterThan(0);
  });

  it("does not invoke the callback for writeWithoutBroadcast writes", () => {
    const cache = createCache();
    let callCount = 0;
    cache.subscribe(() => {
      callCount += 1;
    });

    cache.set(
      "User",
      { id: "u1", name: "Ada", email: "ada@example.com" },
      { writeWithoutBroadcast: true },
    );

    expect(callCount).toBe(0);
  });

  it("returns an unsubscribe function that stops future notifications", () => {
    const cache = createCache();
    let callCount = 0;
    const unsubscribe = cache.subscribe(() => {
      callCount += 1;
    });

    unsubscribe();
    cache.set("User", { id: "u1", name: "Ada", email: "ada@example.com" });

    expect(callCount).toBe(0);
  });
});

describe("NormalizedCache.dispose", () => {
  it("removes all subscribers so they no longer receive notifications", () => {
    const cache = createCache();
    let callCount = 0;
    cache.subscribe(() => {
      callCount += 1;
    });

    cache.dispose();
    cache.set("User", { id: "u1", name: "Ada", email: "ada@example.com" });

    expect(callCount).toBe(0);
  });

  it("removes multiple subscribers", () => {
    const cache = createCache();
    let firstCount = 0;
    let secondCount = 0;
    cache.subscribe(() => {
      firstCount += 1;
    });
    cache.subscribe(() => {
      secondCount += 1;
    });

    cache.dispose();
    cache.set("User", { id: "u1", name: "Ada", email: "ada@example.com" });

    expect(firstCount).toBe(0);
    expect(secondCount).toBe(0);
  });
});
