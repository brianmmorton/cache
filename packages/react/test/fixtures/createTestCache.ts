import { NormalizedCache } from "@normalized-cache/core";
import "./registerRelationships";
import { UserModel } from "./UserModel";
import { PostModel } from "./PostModel";

export function createTestCache() {
  return new NormalizedCache({
    User: UserModel,
    Post: PostModel,
  });
}
