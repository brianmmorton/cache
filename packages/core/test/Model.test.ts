import { describe, expect, it } from "vitest";
import { Model } from "../src/Model";

interface UserModelType {
  id: string;
  name: string;
}

interface FriendModelType {
  id: string;
  userId: string;
  nickname: string;
}

interface UserRelations {
  friends: FriendModelType[];
  bestFriend: FriendModelType | null;
}

interface FriendRelations {
  user: UserModelType | null;
}

describe("Model", () => {
  it("is constructed with a model name", () => {
    const UserModel = new Model<UserModelType>("User");
    expect(UserModel.modelName).toBe("User");
  });

  it("starts with no relationships registered", () => {
    const UserModel = new Model<UserModelType>("User");
    expect(UserModel.getRelationships().size).toBe(0);
  });

  it("registers a hasMany relationship under its 'as' key", () => {
    const UserModel = new Model<UserModelType, UserRelations>("User");
    const FriendModel = new Model<FriendModelType>("Friend");

    UserModel.hasMany(FriendModel, { foreignKey: "userId", as: "friends" });

    const relationship = UserModel.getRelationship("friends");
    expect(relationship).toBeDefined();
    expect(relationship?.kind).toBe("hasMany");
    expect(relationship?.foreignKey).toBe("userId");
    expect(relationship?.relatedModel).toBe(FriendModel);
  });

  it("registers a hasOne relationship under its 'as' key", () => {
    const UserModel = new Model<UserModelType, UserRelations>("User");
    const FriendModel = new Model<FriendModelType>("Friend");

    UserModel.hasOne(FriendModel, { foreignKey: "userId", as: "bestFriend" });

    const relationship = UserModel.getRelationship("bestFriend");
    expect(relationship).toBeDefined();
    expect(relationship?.kind).toBe("hasOne");
    expect(relationship?.foreignKey).toBe("userId");
    expect(relationship?.relatedModel).toBe(FriendModel);
  });

  it("registers a belongsTo relationship under its 'as' key", () => {
    const UserModel = new Model<UserModelType>("User");
    const FriendModel = new Model<FriendModelType, FriendRelations>("Friend");

    FriendModel.belongsTo(UserModel, { foreignKey: "userId", as: "user" });

    const relationship = FriendModel.getRelationship("user");
    expect(relationship).toBeDefined();
    expect(relationship?.kind).toBe("belongsTo");
    expect(relationship?.foreignKey).toBe("userId");
    expect(relationship?.relatedModel).toBe(UserModel);
  });

  it("relationship objects are explicit values returned from the defining call", () => {
    const UserModel = new Model<UserModelType, UserRelations>("User");
    const FriendModel = new Model<FriendModelType>("Friend");

    const relationship = UserModel.hasMany(FriendModel, {
      foreignKey: "userId",
      as: "friends",
    });

    expect(relationship.kind).toBe("hasMany");
    expect(relationship.as).toBe("friends");
    expect(relationship.foreignKey).toBe("userId");
    expect(relationship.relatedModel).toBe(FriendModel);
  });

  it("supports multiple relationships registered on the same model", () => {
    const UserModel = new Model<UserModelType, UserRelations>("User");
    const FriendModel = new Model<FriendModelType>("Friend");

    UserModel.hasMany(FriendModel, { foreignKey: "userId", as: "friends" });
    UserModel.hasOne(FriendModel, { foreignKey: "userId", as: "bestFriend" });

    expect(UserModel.getRelationships().size).toBe(2);
  });
});
