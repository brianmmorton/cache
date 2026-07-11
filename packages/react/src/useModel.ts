import { useCallback, useRef, useSyncExternalStore } from "react";
import type {
  NormalizedCache,
  ModelRegistry,
  EntityId,
  DenormalizedEntityFor,
} from "@normalized-cache/core";

export type UseModelSelector<
  TRegistry extends ModelRegistry,
  TName extends keyof TRegistry & string,
  TSelected,
> = (entity: DenormalizedEntityFor<TRegistry, TName>) => TSelected;

/**
 * Creates a `useModel` hook bound to a specific cache instance. Reads a
 * single entity by model name and id, applying `selector` so the component
 * only re-renders when the selected value changes.
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

      if (lastValueRef.current && Object.is(lastValueRef.current.value, nextValue)) {
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
