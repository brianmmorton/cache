import type { EntityId } from "./EntityId";
import type { Entity } from "./Entity";
import type { ModelRegistry, EntityOf } from "./ModelRegistry";

export type EntityTable<T extends Entity = Entity> = Record<EntityId, T>;

/**
 * The raw valtio proxy shape backing a `NormalizedCache<TRegistry>`: one
 * entity table per registered model, keyed by entity id.
 */
export type CacheState<TRegistry extends ModelRegistry = ModelRegistry> = {
  [TName in keyof TRegistry & string]: EntityTable<EntityOf<TRegistry, TName>>;
};
