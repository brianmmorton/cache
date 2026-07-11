import type { Model } from "../Model";
import type { Entity } from "../types/Entity";
import type { EntityId } from "../types/EntityId";
import { HasManyRelationship } from "../relationships/HasManyRelationship";
import { HasOneRelationship } from "../relationships/HasOneRelationship";
import { BelongsToRelationship } from "../relationships/BelongsToRelationship";
import type { DenormalizationCache } from "./DenormalizationCache";

export interface RawStateReader {
  getEntity(modelName: string, id: EntityId): Entity | undefined;
  getAllEntities(modelName: string): Entity[];
}

/**
 * Builds the object returned by `get`/`getAll`: the stored scalar fields
 * plus one readonly, lazily-evaluated getter per registered relationship.
 * Each getter re-reads the current cache state only when accessed. Results
 * are memoized in `memo` so repeated calls between writes return the same
 * object/array references, which lets consumers (e.g. React's
 * useSyncExternalStore) bail out via reference equality.
 */
export function denormalizeEntity(
  model: Model<any, any>,
  row: Entity,
  reader: RawStateReader,
  memo: DenormalizationCache,
): Entity {
  const cached = memo.getWrapper(row);
  if (cached) {
    return cached;
  }

  const result: Record<string, unknown> = { ...row };

  for (const [as, relationship] of model.getRelationships()) {
    Object.defineProperty(result, as, {
      enumerable: true,
      configurable: true,
      get(): unknown {
        if (memo.hasRelationValue(row, relationship)) {
          return memo.getRelationValue(row, relationship);
        }

        let value: unknown;
        if (relationship instanceof HasManyRelationship) {
          value = findHasMany(relationship, row.id, reader, memo);
        } else if (relationship instanceof HasOneRelationship) {
          value = findHasOne(relationship, row.id, reader, memo);
        } else if (relationship instanceof BelongsToRelationship) {
          value = findBelongsTo(relationship, row, reader, memo);
        }

        memo.setRelationValue(row, relationship, value);
        return value;
      },
    });
  }

  const wrapper = result as unknown as Entity;
  memo.setWrapper(row, wrapper);
  return wrapper;
}

function findHasMany(
  relationship: HasManyRelationship<any>,
  parentId: EntityId,
  reader: RawStateReader,
  memo: DenormalizationCache,
): Entity[] {
  const childModelName = relationship.relatedModel.modelName;
  return reader
    .getAllEntities(childModelName)
    .filter((child) => (child as any)[relationship.foreignKey] === parentId)
    .map((child) => denormalizeEntity(relationship.relatedModel, child, reader, memo));
}

function findHasOne(
  relationship: HasOneRelationship<any>,
  parentId: EntityId,
  reader: RawStateReader,
  memo: DenormalizationCache,
): Entity | null {
  const childModelName = relationship.relatedModel.modelName;
  const child = reader
    .getAllEntities(childModelName)
    .find((candidate) => (candidate as any)[relationship.foreignKey] === parentId);
  return child ? denormalizeEntity(relationship.relatedModel, child, reader, memo) : null;
}

function findBelongsTo(
  relationship: BelongsToRelationship<any>,
  row: Entity,
  reader: RawStateReader,
  memo: DenormalizationCache,
): Entity | null {
  const parentId = (row as any)[relationship.foreignKey] as EntityId | undefined;
  if (parentId === undefined || parentId === null) {
    return null;
  }
  const parent = reader.getEntity(relationship.relatedModel.modelName, parentId);
  return parent ? denormalizeEntity(relationship.relatedModel, parent, reader, memo) : null;
}
