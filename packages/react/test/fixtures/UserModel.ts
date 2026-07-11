import { Model } from "@normalized-cache/core";
import type { UserModelType, UserRelations } from "./types";

export const UserModel = new Model<UserModelType, UserRelations>("User");
