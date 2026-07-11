import type { Model } from "../Model";
import type { Entity } from "../types/Entity";

export interface SplitEntityFields {
  ownFields: Record<string, unknown>;
  relationFields: Map<string, unknown>;
}

/**
 * Separates a raw write payload into the entity's own scalar fields and any
 * nested relationship payloads (keyed by the relationship's `as` name), so
 * relationship data is never persisted directly onto the entity's own table
 * row.
 */
export function splitEntityFields<T extends Entity>(
  model: Model<any, any>,
  data: T,
): SplitEntityFields {
  const relationNames = new Set(model.getRelationships().keys());
  const ownFields: Record<string, unknown> = {};
  const relationFields = new Map<string, unknown>();

  for (const [key, value] of Object.entries(data)) {
    if (relationNames.has(key)) {
      relationFields.set(key, value);
    } else {
      ownFields[key] = value;
    }
  }

  return { ownFields, relationFields };
}
