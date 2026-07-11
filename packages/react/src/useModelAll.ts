import { useCallback, useRef, useSyncExternalStore } from "react";
import type { NormalizedCache, ModelRegistry, DenormalizedEntityFor } from "@normalized-cache/core";

export type UseModelAllSelector<
  TRegistry extends ModelRegistry,
  TName extends keyof TRegistry & string,
  TSelected,
> = (entities: DenormalizedEntityFor<TRegistry, TName>[]) => TSelected;

function shallowArrayEqual(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i += 1) {
    if (!Object.is(a[i], b[i])) {
      return false;
    }
  }
  return true;
}

/**
 * Creates a `useModelAll` hook bound to a specific cache instance. Reads all
 * entities for a model, applying `selector` so the component only
 * re-renders when the selected value changes.
 */
export function createUseModelAll<TRegistry extends ModelRegistry>(
  cache: NormalizedCache<TRegistry>,
) {
  return function useModelAll<
    TName extends keyof TRegistry & string,
    TSelected = DenormalizedEntityFor<TRegistry, TName>[],
  >(modelName: TName, selector?: UseModelAllSelector<TRegistry, TName, TSelected>): TSelected {
    const selectorRef = useRef(selector);
    selectorRef.current = selector;

    const lastValueRef = useRef<{ value: TSelected } | undefined>(undefined);

    const getSnapshot = useCallback((): TSelected => {
      const entities = cache.getAll(modelName);
      const nextValue = (
        selectorRef.current ? selectorRef.current(entities) : (entities as TSelected)
      );

      const prev = lastValueRef.current;
      if (prev) {
        const isEqual =
          Array.isArray(prev.value) && Array.isArray(nextValue)
            ? shallowArrayEqual(prev.value, nextValue)
            : Object.is(prev.value, nextValue);
        if (isEqual) {
          return prev.value;
        }
      }

      lastValueRef.current = { value: nextValue };
      return nextValue;
    }, [modelName]);

    const subscribeToCache = useCallback(
      (onStoreChange: () => void) => cache.subscribe(onStoreChange),
      [],
    );

    return useSyncExternalStore(subscribeToCache, getSnapshot, getSnapshot);
  };
}
