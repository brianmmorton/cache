import { UserModel } from "./UserModel";
import { PostModel } from "./PostModel";

UserModel.hasMany(PostModel, { foreignKey: "userId", as: "posts" });
PostModel.belongsTo(UserModel, { foreignKey: "userId", as: "author" });
