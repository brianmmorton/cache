import { Model } from "@normalized-cache/core";
import type { PostModelType, PostRelations } from "./types";

export const PostModel = new Model<PostModelType, PostRelations>("Post");
