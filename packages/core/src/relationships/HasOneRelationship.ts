import type { Model } from "../Model";
import type { Entity } from "../types/Entity";
import type { HasOneOptions } from "./RelationshipOptions";

export class HasOneRelationship<TChild extends Entity = Entity> {
  readonly kind = "hasOne" as const;
  readonly relatedModel: Model<TChild>;
  readonly foreignKey: string;
  readonly as: string;

  constructor(relatedModel: Model<TChild>, options: HasOneOptions) {
    this.relatedModel = relatedModel;
    this.foreignKey = options.foreignKey;
    this.as = options.as;
  }
}
