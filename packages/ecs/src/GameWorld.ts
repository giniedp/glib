import { EventBus, idMap } from '@gglib/utils'
import { ComponentTypeIds, type GameComponent, type GameComponentType, getComponentType } from './GameComponent'
import { GameEntity, type GameEntityId, type NotGameEntity } from './GameEntity'
import { GameQueryDescriptor } from './GameQuery'
import { GameQueryCache } from './GameQueryCache'
import { GameSystemCollection } from './GameSystem'
import { type GameTransform, GameTransformToken } from './GameTransform'
import type { AbstractType, Type } from './types'

export interface CreateEntityOptions {
  parent?: GameEntity
  name?: string
  transform?: GameTransform
  components?: GameComponent[]
}

export class GameWorld {
  protected entities = idMap<GameEntityId, GameEntity>()
  protected queries = new GameQueryCache(this)
  protected queriesActive = new GameQueryCache(this)
  protected queriesInitialized = new GameQueryCache(this)

  public readonly systems = new GameSystemCollection(this)
  public readonly eventBus = new EventBus()

  public constructor() {
    this.eventBus.on(GameEntity.onInitialized, this.handleEntityInitialized)
    this.eventBus.on(GameEntity.onActivating, this.handleEntityActivating)
    this.eventBus.on(GameEntity.onActivated, this.handleEntityActivated)
    this.eventBus.on(GameEntity.onDeactivating, this.handleEntityDeactivating)
    this.eventBus.on(GameEntity.onDeactivated, this.handleEntityDeactivated)
    this.eventBus.on(GameEntity.onDestroyed, this.handleEntityDestroyed)
  }

  /**
   * Checks if a system of given type is registered or provided in the container
   */
  public hasSystem<T>(type: Type<T> | AbstractType<T>): boolean {
    return this.systems.has(type)
  }

  /**
   * Gets a registered game system or a provided object of given type
   */
  public getSystem<T>(type: Type<T> | AbstractType<T>, options?: { optional: boolean }): T {
    return this.systems.get(type, options)
  }

  /**
   * Provides a `GameSystem` or an arbitrary object for the given type
   */
  public addSystem<T>(value: NotGameEntity<T>, ...typeAndAliases: Array<Type<T> | AbstractType<T>>): void {
    this.systems.add(value, ...typeAndAliases)
  }

  /**
   * Creates a new entity in the world with optional components and parent-child relation
   */
  public createEntity(options?: CreateEntityOptions): GameEntity {
    const entity = new GameEntity(this)

    if (!options) {
      return entity
    }
    entity.name = options.name
    if (options.transform) {
      const type = getComponentType(options.transform)
      entity.addComponent(options.transform, GameTransformToken, type)
    }
    for (const component of options.components || []) {
      entity.addComponent(component)
    }
    if (options.parent) {
      const parent = options.parent.getTransform()
      if (!parent) {
        throw new Error('Parent entity does not have a transform component')
      }
      const child = entity.getTransform()
      if (!child) {
        throw new Error(`${options.name || 'Entity'} does not have a transform component, but a parent was provided`)
      }
      child.setParent(options.parent.getTransform())
    }

    return entity
  }

  public getEntity(id: GameEntityId): GameEntity | null {
    return this.entities.get(id) || null
  }

  /**
   * Attaches an entity to the world after it was created
   *
   * @internal
   * @remarks
   * This is automatically called by the entity constructor.
   */
  public attachEntity(entity: GameEntity) {
    if (entity.world !== this) {
      throw new Error('Entity belongs to another world')
    }

    const entityId = entity.refId
    if (!this.entities.has(entityId)) {
      this.entities.set(entityId, entity)
      queueMicrotask(() => {
        // component list is empty on creation, so we push delay the initial query addition
        this.queries.addEntity(entity.refId, entity.componentTypes())
      })
    } else {
      throw new Error('Entity is already connected to the world')
    }

    this.eventBus.register(entity.events)
  }

  private handleEntityInitialized = (entity: GameEntity) => {
    this.queries.addEntity(entity.refId, entity.componentTypes()) // re-add to update the archetype
    this.queriesInitialized.addEntity(entity.refId, entity.componentTypes())
  }

  private handleEntityActivating = (entity: GameEntity) => {
    this.queriesInitialized.removeEntity(entity.refId)
  }

  private handleEntityActivated = (entity: GameEntity) => {
    this.queriesActive.addEntity(entity.refId, entity.componentTypes())
  }

  private handleEntityDeactivating = (entity: GameEntity) => {
    this.queriesActive.removeEntity(entity.refId)
  }

  private handleEntityDeactivated = (entity: GameEntity) => {
    this.queriesInitialized.addEntity(entity.refId, entity.componentTypes())
  }

  private handleEntityDestroyed = (entity: GameEntity) => {
    this.queries.removeEntity(entity.refId)
    this.queriesActive.removeEntity(entity.refId)
    this.queriesInitialized.removeEntity(entity.refId)
    this.entities.delete(entity.refId)
    this.eventBus.unregister(entity.events)
  }

  /**
   * Initializes the world by initializing all systems and entities
   */
  public initialize() {
    this.initializeSystems()
    this.initializeEntities()
  }

  /**
   * Initializes all systems in the container
   *
   * @remarks
   * Can only be called once.
   */
  public initializeSystems(): void {
    this.systems.initialize()
  }

  /**
   * Initializes all uninitialized entities in the container
   */
  public initializeEntities() {
    for (const id of this.entities.keys) {
      const entity = this.entities.get(id)
      if (entity?.canInitialize) {
        entity.initialize()
      }
    }
  }

  /**
   * Destroys all systems and entities in the container
   */
  public destroy() {
    this.destroyEntities()
    this.destroySystems()
  }

  protected destroyEntities() {
    const ids = [...this.entities.keys]
    while (ids.length > 0) {
      const id = ids.pop()
      const entity = this.entities.get(id)
      this.entities.delete(id)
      if (entity.canDestroy) {
        entity.destroy()
      }
    }
  }

  protected destroySystems() {
    this.systems.destroy()
  }

  private isUpdating = false
  /**
   * Calls update on all systems in the container
   */
  public update(time: number, dt: number): void {
    if (this.isUpdating) {
      throw new Error('Recursive update call detected')
    }
    this.isUpdating = true
    try {
      this.systems.update(time, dt)
    } finally {
      this.isUpdating = false
    }
  }

  private isRendering = false
  /**
   * Calls render on all systems in the container that have a render method
   */
  public render(time: number, dt: number): void {
    if (this.isRendering) {
      throw new Error('Recursive render call detected')
    }
    this.isRendering = true
    try {
      this.systems.render(time, dt)
    } finally {
      this.isRendering = false
    }
  }

  /**
   * Gets a query for the given descriptor.
   */
  public query(descriptor: WorldQueryDescriptor) {
    const scope = descriptor.scope
    const query: GameQueryDescriptor = {
      required: descriptor.required?.map((it) => ComponentTypeIds.getOrCreate(it)),
      optional: descriptor.optional?.map((it) => ComponentTypeIds.getOrCreate(it)),
      rejected: descriptor.rejected?.map((it) => ComponentTypeIds.getOrCreate(it)),
    }
    if (scope === 'active') {
      return this.queriesActive.getQuery(query)
    }
    if (scope === 'initialized') {
      return this.queriesInitialized.getQuery(query)
    }
    return this.queries.getQuery(query)
  }
}

export interface WorldQueryDescriptor {
  scope: 'active' | 'initialized' | 'all'
  required?: GameComponentType[]
  optional?: GameComponentType[]
  rejected?: GameComponentType[]
}
