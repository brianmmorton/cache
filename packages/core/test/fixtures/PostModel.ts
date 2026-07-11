import { Model } from "../../src/Model";
import type { PostModelType, PostRelations } from "./types";

export const PostModel = new Model<PostModelType, PostRelations>("Post");
