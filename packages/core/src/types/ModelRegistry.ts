import type { Model } from "../Model";
import type { Entity } from "./Entity";
import type { RelationsShape } from "./RelationsShape";

/**
 * The object map passed to `new NormalizedCache({ User: UserModel, ... })`.
 * Keys are the literal model names used by `get`/`getAll`/`set`/`delete`.
 */
export type ModelRegistry = Record<string, Model<any, any>>;

export type EntityOf<TRegistry extends ModelRegistry, TName extends keyof TRegistry> =
  TRegistry[TName] extends Model<infer T, any> ? (T extends Entity ? T : never) : never;

export type RelationsOf<TRegistry extends ModelRegistry, TName extends keyof TRegistry> =
  TRegistry[TName] extends Model<any, infer R> ? R : RelationsShape;
