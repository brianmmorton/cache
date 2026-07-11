import type { Model } from "../Model";
import type { Entity } from "../types/Entity";
import type { HasManyOptions } from "./RelationshipOptions";

export class HasManyRelationship<TChild extends Entity = Entity> {
  readonly kind = "hasMany" as const;
  readonly relatedModel: Model<TChild>;
  readonly foreignKey: string;
  readonly as: string;

  constructor(relatedModel: Model<TChild>, options: HasManyOptions) {
    this.relatedModel = relatedModel;
    this.foreignKey = options.foreignKey;
    this.as = options.as;
  }
}
