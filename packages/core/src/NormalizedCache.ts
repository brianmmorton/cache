import { proxy, subscribe as valtioSubscribe } from "valtio/vanilla";
import type { ModelRegistry, EntityOf } from "./types/ModelRegistry";
import type { DenormalizedEntityFor } from "./types/DenormalizedEntityFor";
import type { EntityId } from "./types/EntityId";
import type { WriteOptions } from "./types/WriteOptions";
import type { CacheState, EntityTable } from "./types/CacheState";
import type { Entity } from "./types/Entity";
import type { Model } from "./Model";
import { HasManyRelationship } from "./relationships/HasManyRelationship";
import { HasOneRelationship } from "./relationships/HasOneRelationship";
import { BelongsToRelationship } from "./relationships/BelongsToRelationship";
import { splitEntityFields } from "./normalize/splitEntityFields";
import { shallowEqual } from "./normalize/shallowEqual";
import { denormalizeEntity } from "./normalize/denormalizeEntity";
import type { RawStateReader } from "./normalize/denormalizeEntity";
import { DenormalizationCache } from "./normalize/DenormalizationCache";

export class NormalizedCache<TRegistry extends ModelRegistry> {
  private readonly models: TRegistry;
  private readonly state: CacheState<TRegistry>;
  private readonly listeners = new Set<() => void>();
  private activeUnsubscribe: (() => void) | undefined;
  private readonly reader: RawStateReader;
  private readonly memo = new DenormalizationCache();

  constructor(models: TRegistry) {
    this.models = models;

    const initialState: Record<string, EntityTable> = {};
    for (const modelName of Object.keys(models)) {
      initialState[modelName] = {};
    }
    this.state = proxy(initialState) as CacheState<TRegistry>;

    this.reader = {
      getEntity: (modelName, id) => this.tableFor(modelName)[id],
      getAllEntities: (modelName) => Object.values(this.tableFor(modelName)),
    };

    this.activeUnsubscribe = this.createForwardingSubscription();
  }

  getState(): CacheState<TRegistry> {
    return this.state;
  }

  set<TName extends keyof TRegistry & string>(
    modelName: TName,
    data: EntityOf<TRegistry, TName> | EntityOf<TRegistry, TName>[],
    options?: WriteOptions,
  ): void {
    const entities = Array.isArray(data) ? data : [data];

    this.runWithBroadcastOption(options, () => {
      for (const entity of entities) {
        this.setOne(modelName, entity);
      }
    });
  }

  get<TName extends keyof TRegistry & string>(
    modelName: TName,
    id: EntityId,
  ): DenormalizedEntityFor<TRegistry, TName> | undefined {
    const row = this.tableFor(modelName)[id];
    if (row === undefined) {
      return undefined;
    }
    const model = this.modelFor(modelName);
    return denormalizeEntity(model, row, this.reader, this.memo) as DenormalizedEntityFor<
      TRegistry,
      TName
    >;
  }

  getAll<TName extends keyof TRegistry & string>(
    modelName: TName,
  ): DenormalizedEntityFor<TRegistry, TName>[] {
    const model = this.modelFor(modelName);
    return Object.values(this.tableFor(modelName)).map(
      (row) =>
        denormalizeEntity(model, row, this.reader, this.memo) as DenormalizedEntityFor<
          TRegistry,
          TName
        >,
    );
  }

  delete<TName extends keyof TRegistry & string>(
    modelName: TName,
    id: EntityId,
    options?: WriteOptions,
  ): void {
    this.runWithBroadcastOption(options, () => {
      const table = this.tableFor(modelName);
      if (id in table) {
        // Bump before mutating: the proxy write below notifies subscribers
        // synchronously, so the version must already reflect this change by
        // the time any listener (e.g. a React re-render) reads the cache.
        this.memo.bumpVersion();
        delete table[id];
      }
    });
  }

  clear(): void {
    this.memo.bumpVersion();
    for (const modelName of Object.keys(this.models)) {
      const table = this.tableFor(modelName);
      for (const id of Object.keys(table)) {
        delete table[id];
      }
    }
  }

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  dispose(): void {
    this.listeners.clear();
    this.activeUnsubscribe?.();
    this.activeUnsubscribe = undefined;
  }

  private runWithBroadcastOption(options: WriteOptions | undefined, run: () => void): void {
    if (!options?.writeWithoutBroadcast) {
      run();
      return;
    }

    this.activeUnsubscribe?.();
    this.activeUnsubscribe = undefined;
    try {
      run();
    } finally {
      this.activeUnsubscribe = this.createForwardingSubscription();
    }
  }

  private createForwardingSubscription(): () => void {
    // notifyInSync: listeners run synchronously with the mutation instead of
    // being batched onto a microtask, so writeWithoutBroadcast's detach/
    // reattach window cannot straddle a pending notification.
    return valtioSubscribe(
      this.state,
      () => {
        for (const listener of this.listeners) {
          listener();
        }
      },
      true,
    );
  }

  private setOne(modelName: string, data: Entity): void {
    const model = this.modelFor(modelName);
    const { ownFields, relationFields } = splitEntityFields(model, data);
    const table = this.tableFor(modelName);
    const existing = table[data.id];

    const merged = existing ? { ...existing, ...ownFields } : { ...ownFields };
    if (!existing || !shallowEqual(existing as unknown as Record<string, unknown>, merged)) {
      // Bump before mutating: see the comment in `delete`.
      this.memo.bumpVersion();
      table[data.id] = merged as Entity;
    }

    for (const [as, value] of relationFields) {
      const relationship = model.getRelationship(as)!;
      this.applyRelationField(relationship, data.id, value);
    }
  }

  private applyRelationField(
    relationship: HasManyRelationship<any> | HasOneRelationship<any> | BelongsToRelationship<any>,
    parentId: EntityId,
    value: unknown,
  ): void {
    if (relationship instanceof HasManyRelationship) {
      this.applyHasMany(relationship, parentId, (value as Entity[] | undefined) ?? []);
    } else if (relationship instanceof HasOneRelationship) {
      this.applyHasOne(relationship, parentId, (value as Entity | null | undefined) ?? null);
    } else if (relationship instanceof BelongsToRelationship) {
      this.applyBelongsTo(relationship, value as Entity | null | undefined);
    }
  }

  private applyHasMany(
    relationship: HasManyRelationship<any>,
    parentId: EntityId,
    children: Entity[],
  ): void {
    const childModelName = relationship.relatedModel.modelName;
    const childTable = this.tableFor(childModelName);
    const foreignKey = relationship.foreignKey;

    const newIds = new Set(children.map((child) => child.id));
    for (const [childId, childRow] of Object.entries(childTable)) {
      if ((childRow as any)[foreignKey] === parentId && !newIds.has(childId)) {
        this.memo.bumpVersion();
        delete childTable[childId];
      }
    }

    for (const child of children) {
      this.setOne(childModelName, { ...child, [foreignKey]: parentId } as Entity);
    }
  }

  private applyHasOne(
    relationship: HasOneRelationship<any>,
    parentId: EntityId,
    child: Entity | null,
  ): void {
    const childModelName = relationship.relatedModel.modelName;
    const childTable = this.tableFor(childModelName);
    const foreignKey = relationship.foreignKey;

    for (const [childId, childRow] of Object.entries(childTable)) {
      if ((childRow as any)[foreignKey] === parentId && childId !== child?.id) {
        this.memo.bumpVersion();
        delete childTable[childId];
      }
    }

    if (child) {
      this.setOne(childModelName, { ...child, [foreignKey]: parentId } as Entity);
    }
  }

  private applyBelongsTo(
    relationship: BelongsToRelationship<any>,
    parent: Entity | null | undefined,
  ): void {
    if (!parent) {
      return;
    }
    this.setOne(relationship.relatedModel.modelName, parent);
  }

  private tableFor(modelName: string): EntityTable {
    return (this.state as unknown as Record<string, EntityTable>)[modelName]!;
  }

  private modelFor(modelName: string): Model<any, any> {
    return (this.models as Record<string, Model<any, any>>)[modelName]!;
  }
}
