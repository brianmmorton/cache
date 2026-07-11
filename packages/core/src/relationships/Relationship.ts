import type { HasManyRelationship } from "./HasManyRelationship";
import type { HasOneRelationship } from "./HasOneRelationship";
import type { BelongsToRelationship } from "./BelongsToRelationship";

export type Relationship =
  | HasManyRelationship<any>
  | HasOneRelationship<any>
  | BelongsToRelationship<any>;
