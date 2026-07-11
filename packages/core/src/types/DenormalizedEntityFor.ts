import type { ModelRegistry, EntityOf, RelationsOf } from "./ModelRegistry";
import type { DenormalizedEntity } from "./DenormalizedEntity";

export type DenormalizedEntityFor<
  TRegistry extends ModelRegistry,
  TName extends keyof TRegistry,
> = DenormalizedEntity<EntityOf<TRegistry, TName>, RelationsOf<TRegistry, TName>>;
