import type { NormalizedCache, ModelRegistry } from "@normalized-cache/core";
import { createUseModel } from "./useModel";
import { createUseModelAll } from "./useModelAll";

/**
 * Binds `useModel`/`useModelAll` hooks to a specific `NormalizedCache`
 * instance, so `modelName` arguments and selector callbacks are typed
 * against that cache's model registry.
 */
export function createCacheHooks<TRegistry extends ModelRegistry>(
  cache: NormalizedCache<TRegistry>,
) {
  return {
    useModel: createUseModel(cache),
    useModelAll: createUseModelAll(cache),
  };
}
