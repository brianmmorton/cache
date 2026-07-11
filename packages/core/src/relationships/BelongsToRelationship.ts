import type { Model } from "../Model";
import type { Entity } from "../types/Entity";
import type { BelongsToOptions } from "./RelationshipOptions";

export class BelongsToRelationship<TParent extends Entity = Entity> {
  readonly kind = "belongsTo" as const;
  readonly relatedModel: Model<TParent>;
  readonly foreignKey: string;
  readonly as: string;

  constructor(relatedModel: Model<TParent>, options: BelongsToOptions) {
    this.relatedModel = relatedModel;
    this.foreignKey = options.foreignKey;
    this.as = options.as;
  }
}
