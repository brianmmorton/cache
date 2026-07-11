import type { Entity } from "./Entity";
import type { RelationsShape } from "./RelationsShape";

/**
 * The shape returned by `get`/`getAll`: the raw stored entity fields plus one
 * readonly property per registered relationship. Relationship properties are
 * defined as lazy getters at runtime so related data is only denormalized
 * when accessed.
 */
export type DenormalizedEntity<T extends Entity, R extends RelationsShape> = T & {
  readonly [K in keyof R]: R[K];
};
