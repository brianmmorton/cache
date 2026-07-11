import { describe, expect, it } from "vitest";
import { splitEntityFields } from "../../src/normalize/splitEntityFields";
import { UserModel } from "../fixtures/UserModel";
import "../fixtures/registerRelationships";

describe("splitEntityFields", () => {
  it("puts scalar fields in ownFields", () => {
    const { ownFields } = splitEntityFields(UserModel, {
      id: "u1",
      name: "Ada",
      email: "ada@example.com",
    });

    expect(ownFields).toEqual({ id: "u1", name: "Ada", email: "ada@example.com" });
  });

  it("puts registered relationship fields into relationFields, not ownFields", () => {
    const { ownFields, relationFields } = splitEntityFields(UserModel, {
      id: "u1",
      name: "Ada",
      email: "ada@example.com",
      posts: [{ id: "p1", title: "Hi" }],
    } as any);

    expect(ownFields).toEqual({ id: "u1", name: "Ada", email: "ada@example.com" });
    expect(relationFields.get("posts")).toEqual([{ id: "p1", title: "Hi" }]);
  });

  it("returns an empty relationFields map when no relationship keys are present", () => {
    const { relationFields } = splitEntityFields(UserModel, {
      id: "u1",
      name: "Ada",
      email: "ada@example.com",
    });

    expect(relationFields.size).toBe(0);
  });
});
