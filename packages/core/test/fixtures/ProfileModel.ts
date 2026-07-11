import { Model } from "../../src/Model";
import type { ProfileModelType, ProfileRelations } from "./types";

export const ProfileModel = new Model<ProfileModelType, ProfileRelations>("Profile");
