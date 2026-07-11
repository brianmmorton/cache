import "./registerRelationships";
import { UserModel } from "./UserModel";
import { PostModel } from "./PostModel";
import { ProfileModel } from "./ProfileModel";

export const modelRegistry = {
  User: UserModel,
  Post: PostModel,
  Profile: ProfileModel,
};
