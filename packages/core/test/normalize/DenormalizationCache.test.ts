import { describe, expect, it } from "vitest";
import { DenormalizationCache } from "../../src/normalize/DenormalizationCache";
import { HasManyRelationship } from "../../src/relationships/HasManyRelationship";
import { PostModel } from "../fixtures/PostModel";

describe("DenormalizationCache", () => {
  it("returns undefined for a wrapper that has not been cached", () => {
    const memo = new DenormalizationCache();
    expect(memo.getWrapper({ id: "u1" })).toBeUndefined();
  });

  it("returns the cached wrapper when the version has not changed", () => {
    const memo = new DenormalizationCache();
    const row = { id: "u1" };
    const wrapper = { id: "u1", name: "Ada" };

    memo.setWrapper(row, wrapper);

    expect(memo.getWrapper(row)).toBe(wrapper);
  });

  it("invalidates cached wrappers after a version bump", () => {
    const memo = new DenormalizationCache();
    const row = { id: "u1" };
    const wrapper = { id: "u1", name: "Ada" };

    memo.setWrapper(row, wrapper);
    memo.bumpVersion();

    expect(memo.getWrapper(row)).toBeUndefined();
  });

  it("caches relationship values per row and relationship", () => {
    const memo = new DenormalizationCache();
    const row = { id: "u1" };
    const relationship = new HasManyRelationship(PostModel, {
      foreignKey: "userId",
      as: "posts",
    });
    const posts = [{ id: "p1" }];

    expect(memo.hasRelationValue(row, relationship)).toBe(false);
    memo.setRelationValue(row, relationship, posts);

    expect(memo.hasRelationValue(row, relationship)).toBe(true);
    expect(memo.getRelationValue(row, relationship)).toBe(posts);
  });

  it("invalidates cached relationship values after a version bump", () => {
    const memo = new DenormalizationCache();
    const row = { id: "u1" };
    const relationship = new HasManyRelationship(PostModel, {
      foreignKey: "userId",
      as: "posts",
    });

    memo.setRelationValue(row, relationship, [{ id: "p1" }]);
    memo.bumpVersion();

    expect(memo.hasRelationValue(row, relationship)).toBe(false);
  });
});
