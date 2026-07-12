/**
 * One-level-deep equality check used to compare selector output between
 * renders. `useSyncExternalStore` requires `getSnapshot()` to return a
 * referentially stable value when nothing has changed — React compares
 * snapshots with `Object.is`, and a snapshot that allocates a new
 * array/object every call (e.g. `entity => entity.items.map(...)`) will
 * never look "unchanged" to `Object.is` alone, causing an infinite
 * render loop. This function lets the hooks recognize when a freshly
 * allocated array/object is shallow-equal to the previous one, so the
 * cached reference can be reused and `useSyncExternalStore`'s stability
 * requirement is satisfied.
 *
 * Arrays are compared element-wise; plain objects are compared key-by-key;
 * everything else (including mismatched types) falls back to `Object.is`.
 */
export function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) {
    return true;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
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

  if (isPlainObject(a) && isPlainObject(b)) {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) {
      return false;
    }
    for (const key of aKeys) {
      if (
        !Object.prototype.hasOwnProperty.call(b, key) ||
        !Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
      ) {
        return false;
      }
    }
    return true;
  }

  return false;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
