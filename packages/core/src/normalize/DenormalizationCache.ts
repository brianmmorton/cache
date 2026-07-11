import type { Entity } from "../types/Entity";
import type { Relationship } from "../relationships/Relationship";

/**
 * Memoizes denormalized entity wrappers and relationship arrays/values so
 * that repeated `get`/`getAll` calls return reference-stable results when
 * nothing in the cache has changed since the last read. Keyed off a single
 * version counter bumped by `NormalizedCache` only on writes that actually
 * mutate a table, so unrelated reads stay cheap and React's
 * `useSyncExternalStore` selectors can bail out via `Object.is`.
 */
export class DenormalizationCache {
  private version = 0;
  private readonly wrappers = new WeakMap<Entity, { version: number; wrapper: Entity }>();
  private readonly relations = new WeakMap<
    Entity,
    Map<Relationship, { version: number; value: unknown }>
  >();

  bumpVersion(): void {
    this.version += 1;
  }

  getWrapper(row: Entity): Entity | undefined {
    const cached = this.wrappers.get(row);
    return cached && cached.version === this.version ? cached.wrapper : undefined;
  }

  setWrapper(row: Entity, wrapper: Entity): void {
    this.wrappers.set(row, { version: this.version, wrapper });
  }

  getRelationValue(row: Entity, relationship: Relationship): unknown {
    const cached = this.relations.get(row)?.get(relationship);
    return cached && cached.version === this.version ? cached.value : undefined;
  }

  hasRelationValue(row: Entity, relationship: Relationship): boolean {
    const cached = this.relations.get(row)?.get(relationship);
    return cached !== undefined && cached.version === this.version;
  }

  setRelationValue(row: Entity, relationship: Relationship, value: unknown): void {
    let byRelationship = this.relations.get(row);
    if (!byRelationship) {
      byRelationship = new Map();
      this.relations.set(row, byRelationship);
    }
    byRelationship.set(relationship, { version: this.version, value });
  }
}
