import { EventEmitter, idMap } from '@gglib/utils'
import { ComponentTypeIds, type GameComponent, type GameComponentType, getComponentType } from './GameComponent'
import { GameEntity, type GameEntityId, type NotGameEntity } from './GameEntity'
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
  protected events = new EventEmitter()

  public readonly systems = new GameSystemCollection(this)
  public readonly onEntityInitialized = this.events.channel<GameEntity>('entityInitialized')
  public readonly onEntityActivating = this.events.channel<GameEntity>('entityActivating')
  public readonly onEntityActivated = this.events.channel<GameEntity>('entityActivated')
  public readonly onEntityDeactivating = this.events.channel<GameEntity>('entityDeactivating')
  public readonly onEntityDeactivated = this.events.channel<GameEntity>('entityDeactivated')
  public readonly onEntityDestroyed = this.events.channel<GameEntity>('entityDestroyed')

  //public onEntityActivating =
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
    } else {
      throw new Error('Entity is already connected to the world')
    }

    entity.onInitialized.add(this.handleEntityInitialized)
    entity.onActivating.add(this.handleEntityActivating)
    entity.onActivated.add(this.handleEntityActivated)
    entity.onDeactivating.add(this.handleEntityDeactivating)
    entity.onDeactivated.add(this.handleEntityDeactivated)
    entity.onDestroyed.add(this.handleEntityDestroyed)
  }

  private handleEntityInitialized = (entity: GameEntity) => {
    this.onEntityInitialized.emit(entity)
  }

  private handleEntityActivating = (entity: GameEntity) => {
    this.onEntityActivating.emit(entity)
  }

  private handleEntityActivated = (entity: GameEntity) => {
    this.queries.addEntity(entity.refId, entity.componentTypes())
    this.onEntityActivated.emit(entity)
  }

  private handleEntityDeactivating = (entity: GameEntity) => {
    this.queries.removeEntity(entity.refId)
    this.onEntityDeactivating.emit(entity)
  }

  private handleEntityDeactivated = (entity: GameEntity) => {
    this.onEntityDeactivated.emit(entity)
  }

  private handleEntityDestroyed = (entity: GameEntity) => {
    this.entities.delete(entity.refId)
    this.onEntityDestroyed.emit(entity)
  }

  /**
   * Initializes the world by initializing all systems and entities
   */
  public initilize() {
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
    return this.queries.getQuery({
      required: descriptor.required?.map((it) => ComponentTypeIds.getOrCreate(it)),
      optional: descriptor.optional?.map((it) => ComponentTypeIds.getOrCreate(it)),
      rejected: descriptor.rejected?.map((it) => ComponentTypeIds.getOrCreate(it)),
    })
  }
}

export interface WorldQueryDescriptor {
  required?: GameComponentType[]
  optional?: GameComponentType[]
  rejected?: GameComponentType[]
}
