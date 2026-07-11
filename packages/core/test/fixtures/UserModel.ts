import { Model } from "../../src/Model";
import type { UserModelType, UserRelations } from "./types";

export const UserModel = new Model<UserModelType, UserRelations>("User");
