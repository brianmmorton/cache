import { useCallback, useRef, useSyncExternalStore } from "react";
import type { NormalizedCache, ModelRegistry, DenormalizedEntityFor } from "@normalized-cache/core";
import { shallowEqual } from "./shallowEqual";

export type UseModelAllSelector<
  TRegistry extends ModelRegistry,
  TName extends keyof TRegistry & string,
  TSelected,
> = (entities: DenormalizedEntityFor<TRegistry, TName>[]) => TSelected;

/**
 * Creates a `useModelAll` hook bound to a specific cache instance. Reads all
 * entities for a model, applying `selector` so the component only
 * re-renders when the selected value changes.
 *
 * Like `useModel`, this is built on `useSyncExternalStore`, so `getSnapshot`
 * must return a referentially stable value when nothing has changed. A
 * `selector` that derives a new array/object every call (e.g.
 * `entities => entities.map(e => e.id)`) is compared against the previous
 * output with a one-level-deep shallow equality check, so the cached
 * reference is reused when the derived value hasn't actually changed. See
 * `shallowEqual` in `./shallowEqual.ts` for details.
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
      if (prev && shallowEqual(prev.value, nextValue)) {
        return prev.value;
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
