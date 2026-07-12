import { useCallback, useRef, useSyncExternalStore } from "react";
import type {
  NormalizedCache,
  ModelRegistry,
  EntityId,
  DenormalizedEntityFor,
} from "@normalized-cache/core";
import { shallowEqual } from "./shallowEqual";

export type UseModelSelector<
  TRegistry extends ModelRegistry,
  TName extends keyof TRegistry & string,
  TSelected,
> = (entity: DenormalizedEntityFor<TRegistry, TName>) => TSelected;

/**
 * Creates a `useModel` hook bound to a specific cache instance. Reads a
 * single entity by model name and id, applying `selector` so the component
 * only re-renders when the selected value changes.
 *
 * `useModel` is built on `useSyncExternalStore`, which requires
 * `getSnapshot()` to return a referentially stable value when nothing has
 * changed — otherwise React re-renders, calls `getSnapshot` again, sees a
 * new reference again, and loops forever. `cache.get()` already returns a
 * stable reference for an unchanged entity, but a `selector` that derives a
 * new array/object on every call (e.g. `entity => entity.items.map(...)`)
 * would defeat that. To guard against this, the selector's output is
 * compared to the previous output with a one-level-deep shallow equality
 * check (array elements / object values compared with `Object.is`) — if
 * they're shallow-equal, the previously cached reference is reused instead
 * of the newly allocated one. Selectors that already return stable
 * references (the entity itself, a primitive, a memoized value) are
 * unaffected — the fast `Object.is` path still short-circuits first.
 */
export function createUseModel<TRegistry extends ModelRegistry>(
  cache: NormalizedCache<TRegistry>,
) {
  return function useModel<
    TName extends keyof TRegistry & string,
    TSelected = DenormalizedEntityFor<TRegistry, TName> | undefined,
  >(
    modelName: TName,
    id: EntityId | undefined | null,
    selector?: UseModelSelector<TRegistry, TName, TSelected>,
  ): TSelected {
    const selectorRef = useRef(selector);
    selectorRef.current = selector;

    const lastValueRef = useRef<{ value: TSelected } | undefined>(undefined);

    const getSnapshot = useCallback((): TSelected => {
      const entity = id === undefined || id === null ? undefined : cache.get(modelName, id);
      const nextValue: TSelected =
        entity === undefined
          ? (undefined as TSelected)
          : selectorRef.current
            ? selectorRef.current(entity)
            : (entity as TSelected);

      if (lastValueRef.current && shallowEqual(lastValueRef.current.value, nextValue)) {
        return lastValueRef.current.value;
      }
      lastValueRef.current = { value: nextValue };
      return nextValue;
    }, [modelName, id]);

    const subscribeToCache = useCallback(
      (onStoreChange: () => void) => cache.subscribe(onStoreChange),
      [],
    );

    return useSyncExternalStore(subscribeToCache, getSnapshot, getSnapshot);
  };
}
