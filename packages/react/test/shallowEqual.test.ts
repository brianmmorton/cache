import { describe, expect, it } from "vitest";
import { shallowEqual } from "../src/shallowEqual";

describe("shallowEqual", () => {
  it("returns true for the same reference", () => {
    const value = { a: 1 };
    expect(shallowEqual(value, value)).toBe(true);
  });

  it("returns true for arrays with equal elements", () => {
    expect(shallowEqual([1, 2, 3], [1, 2, 3])).toBe(true);
  });

  it("returns false for arrays with different lengths", () => {
    expect(shallowEqual([1, 2], [1, 2, 3])).toBe(false);
  });

  it("returns false for arrays with different elements", () => {
    expect(shallowEqual([1, 2, 3], [1, 2, 4])).toBe(false);
  });

  it("returns true for arrays of entity references that are unchanged", () => {
    const e1 = { id: "1" };
    const e2 = { id: "2" };
    expect(shallowEqual([e1, e2], [e1, e2])).toBe(true);
  });

  it("returns true for plain objects with equal values", () => {
    expect(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
  });

  it("returns false for plain objects with different values", () => {
    expect(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
  });

  it("returns false for plain objects with different keys", () => {
    expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  it("does not recurse into nested arrays/objects (one level deep only)", () => {
    expect(shallowEqual({ a: [1, 2] }, { a: [1, 2] })).toBe(false);
    expect(shallowEqual([{ a: 1 }], [{ a: 1 }])).toBe(false);
  });

  it("returns false when comparing mismatched types", () => {
    expect(shallowEqual([1, 2], { 0: 1, 1: 2 })).toBe(false);
    expect(shallowEqual(undefined, {})).toBe(false);
    expect(shallowEqual(null, {})).toBe(false);
  });

  it("falls back to Object.is for primitives", () => {
    expect(shallowEqual(1, 1)).toBe(true);
    expect(shallowEqual(NaN, NaN)).toBe(true);
    expect(shallowEqual("a", "b")).toBe(false);
  });
});
