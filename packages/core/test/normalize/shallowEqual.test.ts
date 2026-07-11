import { describe, expect, it } from "vitest";
import { shallowEqual } from "../../src/normalize/shallowEqual";

describe("shallowEqual", () => {
  it("returns true for two objects with identical keys and primitive values", () => {
    expect(shallowEqual({ a: 1, b: "x" }, { a: 1, b: "x" })).toBe(true);
  });

  it("returns false when a value differs", () => {
    expect(shallowEqual({ a: 1 }, { a: 2 })).toBe(false);
  });

  it("returns false when key counts differ", () => {
    expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  it("returns false when a key is missing from one side", () => {
    expect(shallowEqual({ a: 1, b: 2 }, { a: 1, c: 2 })).toBe(false);
  });

  it("uses reference equality for nested objects (shallow, not deep)", () => {
    const nested = { x: 1 };
    expect(shallowEqual({ a: nested }, { a: { x: 1 } })).toBe(false);
    expect(shallowEqual({ a: nested }, { a: nested })).toBe(true);
  });

  it("returns true for two empty objects", () => {
    expect(shallowEqual({}, {})).toBe(true);
  });
});
