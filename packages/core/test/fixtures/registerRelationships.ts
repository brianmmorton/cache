import { UserModel } from "./UserModel";
import { PostModel } from "./PostModel";
import { ProfileModel } from "./ProfileModel";

UserModel.hasMany(PostModel, { foreignKey: "userId", as: "posts" });
UserModel.hasOne(ProfileModel, { foreignKey: "userId", as: "profile" });
PostModel.belongsTo(UserModel, { foreignKey: "userId", as: "author" });
ProfileModel.belongsTo(UserModel, { foreignKey: "userId", as: "user" });
