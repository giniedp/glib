import { addItemIfAbsent, append, Brand, EventEmitter, type AbstractType, type Type } from '@gglib/utils'
import {
  ComponentIds,
  ComponentTypeIds,
  type GameComponent,
  type GameComponentId,
  type GameComponentType,
  type GameComponentTypeId,
} from './GameComponent'
import { describeEntityState, GameEntityState } from './GameEntityState'
import { GameTransformToken, type GameTransform } from './GameTransform'
import type { GameWorld } from './GameWorld'
import { idProvider } from './utils/idProvider'

export type GameEntityId = Brand<number, 'GameEntityId'>

const EntityIds = idProvider<GameEntityId, GameEntity>(Symbol('GameEntityId'))
export interface GetComponentOptions {
  /**
   * If true, keeps looking up the entity hierarchy
   */
  readonly followParent?: boolean
  /**
   * If true, skips to the parent container. Only viable if `followParent` is true.
   */
  readonly skipSelf?: boolean
  /**
   * If true, does not throw an error if the system is not found.
   */
  readonly optional?: boolean
}

export const GetComponent = {
  Optional: { optional: true } as const,
  OptionalFollowParent: { optional: true, followParent: true } as const,
  OptionalSkipSelf: { optional: true, followParent: true, skipSelf: true } as const,
  SkipSelf: { followParent: true, skipSelf: true } as const,
}

export type NotGameEntity<T> = T & (T extends GameEntity ? never : T)
export class GameEntity {
  /**
   * The unique runtime ID of this entity.
   *
   * @remarks
   * In traditional ECS this would be the actual `entity`
   */
  public get refId() {
    return EntityIds.getOrCreate(this)
  }

  /**
   * A user defined ID of this entity
   *
   * @remarks
   * This property is not used by the entity itself.
   * Its up to the user to set the id and ensure it is unique if needed.
   */
  public id: number | string

  /**
   * A user defined name of this entity
   */
  public name: string

  /**
   * The world this entity has been initialized in
   */
  public readonly world: GameWorld

  /**
   * Current state of the entity
   */
  public readonly state: GameEntityState = GameEntityState.Created

  /**
   * A helper property for debugging that describes the current state of the entity
   */
  public get stateName() {
    return describeEntityState(this.state)
  }

  /**
   * An opaque event emmitter that can be used by components as one way of cummunication
   */
  public readonly events = new EventEmitter()

  public readonly onInitialized = this.events.channel<GameEntity>('initialized')
  public readonly onDestroyed = this.events.channel<GameEntity>('destroyed')
  public readonly onActivating = this.events.channel<GameEntity>('beforeActivate')
  public readonly onActivated = this.events.channel<GameEntity>('activated')
  public readonly onDeactivating = this.events.channel<GameEntity>('beforeDeactivate')
  public readonly onDeactivated = this.events.channel<GameEntity>('deactivated')
  public readonly onComponentAdded = this.events.channel<[GameEntity, GameComponent]>('componentAdded')
  public readonly onComponentRemoved = this.events.channel<[GameEntity, GameComponent]>('componentRemoved')

  /**
   * Gets the transform component of this entity
   */
  public getTransform<T extends GameTransform = GameTransform>(): T | null {
    return this.component<T>(GameTransformToken, { optional: true })
  }

  /**
   * Sets the parent of this entity by setting the parent of its transform component.
   */
  public setParent(entity: GameEntity | null): void {
    this.getTransform().setParent(entity?.getTransform() || null)
  }

  /**
   * Gets the entity of the parent transform if it exists
   */
  public get parent(): GameEntity | null {
    return this.getTransform()?.parent?.entity || null
  }

  public constructor(world: GameWorld) {
    this.world = world
    world.attachEntity(this)
  }

  private componentByType: Record<GameComponentTypeId, GameComponent> = {}
  private typesByComponentId: Record<GameComponentId, GameComponentTypeId[]> = {}
  private types: GameComponentTypeId[] = []

  // all known components that are controlled by this entity
  private components: GameComponent[] = []
  // components that are not initialized yet
  private toInitialize: GameComponent[] = []
  // components that are initialized but not enabled yet
  private toActivate: GameComponent[] = []
  // components that are initialized and enabled and ready for action
  private activated: GameComponent[] = []

  public get activeComponents(): ReadonlyArray<GameComponent> {
    return this.activated
  }

  public get canInitialize() {
    return this.state === GameEntityState.Created
  }

  public get canActivate() {
    return this.state === GameEntityState.Initialized
  }

  public get canDeactivate() {
    return this.state === GameEntityState.Activated
  }

  public get canDestroy() {
    return this.state !== GameEntityState.Destroyed
  }

  public get isInitialized() {
    return this.state >= GameEntityState.Initialized && this.state <= GameEntityState.Activated
  }

  public get isActive() {
    return this.state === GameEntityState.Activated
  }

  public get isDestroyed() {
    return this.state === GameEntityState.Destroyed
  }

  /**
   * Initializes this entity by calling initialize on all components.
   * This can be called only once in the lifetime of the entity.
   *
   * @throws Error if the entity is already initialized.
   */
  public initialize(): void {
    if (this.state != GameEntityState.Created) {
      throw new Error(
        `Entity must have state ${describeEntityState(GameEntityState.Created)} to initialize but was ${describeEntityState(this.state)}`,
      )
    }

    this.setState(GameEntityState.Initializing)

    while (this.toInitialize.length > 0) {
      const component = this.toInitialize.shift()
      if (initializeComponent(component, this)) {
        this.toActivate.push(component)
      }
    }

    this.setState(GameEntityState.Initialized)
    if (!this.getTransform()) {
      console.warn('Entity was initialized without a transform component')
    }
    this.onInitialized.emit(this)
  }

  /**
   * Activates all components owned by this entity.
   *
   * @remarks
   * - Can be called multiple times during the lifetime of the entity.
   * - Can be called only when the entity is in the initialized state.
   */
  public activate(): void {
    this.assertState(GameEntityState.Initialized)
    this.setState(GameEntityState.Activating)
    this.onActivating.emit(this)
    while (this.toActivate.length > 0) {
      const component = this.toActivate.shift()
      activateComponent(component)
      this.activated.push(component)
    }
    this.setState(GameEntityState.Activated)
    this.onActivated.emit(this)
  }

  /**
   * Deactivates all components owned by this entity.
   *
   * @remarks
   * - Can be called multiple times during the lifetime of the entity.
   * - Can be called only when the entity is in the activated state.
   */
  public deactivate(): void {
    this.assertState(GameEntityState.Activated)
    this.setState(GameEntityState.Deactivating)
    this.onDeactivating.emit(this)
    while (this.activated.length > 0) {
      const component = this.activated.shift()
      deactivateComponent(component)
      this.toActivate.push(component)
    }
    this.setState(GameEntityState.Initialized)
    this.onDeactivated.emit(this)
  }

  /**
   * Deactivates this entity and destroys all components.
   */
  public destroy(): void {
    if (this.canDeactivate) {
      this.deactivate()
    }
    if (this.isDestroyed) {
      return
    }

    this.assertNotState(GameEntityState.Destroyed)
    this.setState(GameEntityState.Destroying)
    for (const component of this.components) {
      destroyComponent(component)
    }
    this.setState(GameEntityState.Destroyed)
    this.onDestroyed.emit(this)
  }

  /**
   * Checks whether the component instance is already owned by this entity.
   */
  public contains(component: GameComponent): boolean {
    return this.components.includes(component)
  }

  /**
   * Checks whether the entity has a component of the given type.
   */
  public has<T extends GameComponent>(type: GameComponentType<T>): boolean {
    return ComponentTypeIds.get(type) in this.componentByType
  }

  /**
   * Adds multiple components to the entity and registers them in the 'by type' lookup registry.
   * @see addComponent
   */
  public addComponents(...components: GameComponent[]): this {
    for (const component of components) {
      this.addComponent(component)
    }
    return this
  }

  /**
   * Adds a component to the entity and registers it in the 'by type' lookup registry.
   * - Only one component of a given type can be added and registered at the entity.
   * - Multiple components of the same type can only be added by explicitly setting the type to `null`.
   *
   * If a given component is an instance of a class, the type parameter is optional and will be inferred from its constructor.
   *
   * If a given component is a plain object, the type parameter must be provided.
   *
   * @param component The component to add
   * @param type The type to associate the component with. Use `null` to bypass the lookup registry and add multiple instances of same type.
   * @throws Error if the component is already added to the entity
   * @throws Error if the component type is already registered
   */
  public addComponent<T extends GameComponent>(component: GameComponent, ...types: Array<GameComponentType<T>>): this {
    if (!types.length && component.constructor) {
      if (component.constructor === Object) {
        throw new Error('Plain objects must have an explicit type provided when added as components')
      }
      types = [component.constructor as GameComponentType<T>]
    }

    if (this.state >= GameEntityState.Activated) {
      throw new Error('Cannot add component while entity is active or destroyed')
    }

    if (this.components.includes(component)) {
      console.warn('Component already added to entity', component)
      return this
    }

    for (const type of types) {
      if (this.has(type)) {
        throw new Error(`Component of type ${getTypeName(type)} already exists`)
      }
    }

    const id = ComponentIds.getOrCreate(component)
    for (const type of types) {
      const typeId = ComponentTypeIds.getOrCreate(type)
      this.componentByType[typeId] = component
      this.typesByComponentId[id] ||= []
      addItemIfAbsent(this.typesByComponentId[id], typeId)
      addItemIfAbsent(this.types, typeId)
    }

    this.components.push(component)
    component.entity = this
    this.onComponentAdded.emit([this, component])

    switch (this.state) {
      case GameEntityState.Created:
      case GameEntityState.Initializing:
        this.toInitialize.push(component)
        break
      case GameEntityState.Initialized:
      case GameEntityState.Activating:
        if (initializeComponent(component, this)) {
          this.toActivate.push(component)
        }
        break
    }
    return this
  }

  public removeComponentByType<T extends GameComponent>(type: GameComponentType<T>): void {
    const component = this.component(type, GetComponent.Optional)
    if (component) {
      this.removeComponent(component)
    }
  }

  /**
   * Removes a component from the entity
   */
  public removeComponent(component: GameComponent): void {
    if (this.state >= GameEntityState.Activated) {
      throw new Error('Cannot remove component while entity is active or destroyed')
    }
    removeItem(this.components, component)
    removeItem(this.toInitialize, component)
    removeItem(this.toActivate, component)
    const id = ComponentIds.get(component)
    const types = this.typesByComponentId[id]
    delete this.typesByComponentId[id]
    if (types) {
      for (const typeId of types) {
        removeItem(this.types, typeId)
        delete this.componentByType[typeId]
      }
    }
    this.onComponentRemoved.emit([this, component])
  }

  public getOrCreateComponent<T extends GameComponent>(type: GameComponentType<T>, factory: () => T): T {
    if (this.has(type)) {
      return this.component(type)
    }
    const component = factory()
    this.addComponent(component, type)
    return component
  }

  /**
   * Looks up a component by type on the entity
   */
  public component<T extends GameComponent>(type: GameComponentType<T>, options?: GetComponentOptions): T {
    const id = ComponentTypeIds.get(type)
    let result = this.componentByType[id]
    if (!options?.followParent) {
      if (result) {
        return result as T
      }
      if (options?.optional) {
        return null
      }
      throw new Error(`Component of type ${getTypeName(type)} not found`)
    }
    if (options.skipSelf || !result) {
      result = this.getTransform()?.parent?.entity?.component(type, {
        ...options,
        skipSelf: false,
      })
    }
    if (result) {
      return result as T
    }
    if (options?.optional) {
      return null
    }
    throw new Error(`Component of type ${getTypeName(type)} not found`)
  }

  /**
   * Looks up a game system in the world registry. If not found, tries to look up
   * a game component of the given type up the entity hierarchy and returns it if found.
   */
  public service<T>(type: Type<T> | AbstractType<T>, options?: GetComponentOptions): T {
    if (this.world.hasSystem(type)) {
      return this.world.getSystem(type)
    }
    return this.component<any>(type, options)
  }

  /**
   * Looks up a component by predicate on the entity
   * Does not throw an error if the component is not found
   */
  public find(predicate: (it: GameComponent) => boolean): GameComponent | null {
    for (const component of this.components) {
      if (predicate(component)) {
        return component
      }
    }
    return null
  }

  /**
   * Gets all component types currently registered on this entity
   */
  public componentTypes(): Array<GameComponentTypeId> {
    return this.types
  }

  /**
   * Gets the names of all component types currently registered on this entity
   * @remarks This is a helper method for debugging and should not be used in performance critical code.
   */
  public get componentTypeNames(): string[] {
    return this.componentTypes().map((typeId) => {
      const type = this.componentByType[typeId]
      return getTypeName(type.constructor)
    })
  }

  private assertState(expected: GameEntityState): void {
    if (this.state !== expected) {
      throw new Error(
        `Expected Entity (${this.name || this.refId}) to be in ${describeEntityState(expected)} state but was ${describeEntityState(this.state)}`,
      )
    }
  }

  private assertNotState(state: GameEntityState): void {
    if (this.state === state) {
      throw new Error(`Expected Entity (${this.name || this.refId}) to not be in ${describeEntityState(state)} state`)
    }
  }

  private setState(state: GameEntityState) {
    ;(this as Mutable<this>).state = state
  }
}

type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}

function removeItem<T>(array: T[], item: T) {
  const index = array.indexOf(item)
  if (index > -1) {
    array.splice(index, 1)
  }
}

function initializeComponent(component: GameComponent, entity: GameEntity): boolean {
  try {
    component.initialize?.()
  } catch (e) {
    console.error('Error initializing component', component, e)
    return false
  }
  return true
}

function activateComponent(component: GameComponent): boolean {
  try {
    component.activate?.()
  } catch (e) {
    console.error('Error enabling component', component, e)
    return false
  }
  return true
}

function deactivateComponent(component: GameComponent): boolean {
  try {
    component.deactivate?.()
  } catch (e) {
    console.error('Error disabling component', component, e)
    return false
  }
  return true
}

function destroyComponent(component: GameComponent): boolean {
  try {
    component.destroy?.()
  } catch (e) {
    console.error('Error destroying component', component, e)
    return false
  }
  return true
}

function getTypeName(type: any): string {
  if (typeof type === 'function') {
    return type.name || '(anonymous)'
  } else if (typeof type === 'string') {
    return type
  } else {
    return String(type)
  }
}
