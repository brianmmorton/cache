import type { Entity } from "./types/Entity";
import type { RelationsShape } from "./types/RelationsShape";
import { HasManyRelationship } from "./relationships/HasManyRelationship";
import { HasOneRelationship } from "./relationships/HasOneRelationship";
import { BelongsToRelationship } from "./relationships/BelongsToRelationship";
import type {
  HasManyOptions,
  HasOneOptions,
  BelongsToOptions,
} from "./relationships/RelationshipOptions";
import type { Relationship } from "./relationships/Relationship";

type ElementOf<TArray> = TArray extends Array<infer TElement> ? TElement : never;
type Nullable<TValue> = TValue extends infer TValue2 | null | undefined ? TValue2 : TValue;

export class Model<T extends Entity = Entity, R extends RelationsShape = RelationsShape> {
  readonly modelName: string;
  private readonly relationships = new Map<string, Relationship>();

  /** Phantom-only fields to carry T/R through generic inference; never assigned at runtime. */
  declare readonly __entityType: T;
  declare readonly __relationsType: R;

  constructor(modelName: string) {
    this.modelName = modelName;
  }

  hasMany<K extends keyof R & string, TChild extends Entity = Entity & ElementOf<R[K]>>(
    relatedModel: Model<TChild, any>,
    options: HasManyOptions & { as: K },
  ): HasManyRelationship<TChild> {
    const relationship = new HasManyRelationship<TChild>(relatedModel, options);
    this.relationships.set(options.as, relationship);
    return relationship;
  }

  hasOne<K extends keyof R & string, TChild extends Entity = Entity & Nullable<R[K]>>(
    relatedModel: Model<TChild, any>,
    options: HasOneOptions & { as: K },
  ): HasOneRelationship<TChild> {
    const relationship = new HasOneRelationship<TChild>(relatedModel, options);
    this.relationships.set(options.as, relationship);
    return relationship;
  }

  belongsTo<K extends keyof R & string, TParent extends Entity = Entity & Nullable<R[K]>>(
    relatedModel: Model<TParent, any>,
    options: BelongsToOptions & { as: K },
  ): BelongsToRelationship<TParent> {
    const relationship = new BelongsToRelationship<TParent>(relatedModel, options);
    this.relationships.set(options.as, relationship);
    return relationship;
  }

  getRelationships(): ReadonlyMap<string, Relationship> {
    return this.relationships;
  }

  getRelationship(as: string): Relationship | undefined {
    return this.relationships.get(as);
  }
}
