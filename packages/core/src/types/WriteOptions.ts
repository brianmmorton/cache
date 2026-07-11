export interface WriteOptions {
  /**
   * When true, this write updates the cache state without notifying valtio
   * subscribers. Useful for large batched writes from a listener callback,
   * to avoid re-triggering that same listener in an infinite loop.
   */
  writeWithoutBroadcast?: boolean;
}
