import { EventEmitter } from '@gglib/utils'
import type { GameComponent, GameComponentType } from './GameComponent'
import { GameProvider, GameSystem } from './GameSystem'
import { GameTransform } from './GameTransform'

export const enum EntityState {
  Created = 0,
  Initializing = 1,
  Initialized = 2,
  Activating = 3,
  Activated = 4,
  Deactivating = 5,
  Destroying = 6,
  Destroyed = 7,
}

export class GameEntity<Transform extends GameTransform = GameTransform> {
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
   * The container that provides access to global (or local) game systems or services.
   */
  public provider: GameProvider

  /**
   * Current state of the entity
   */
  public state: EntityState = EntityState.Created

  /**
   * An opaque event emmitter that can be used by components as one way of cummunication
   */
  public events = new EventEmitter()

  /**
   * The transform component of this entity.
   *
   * @remarks
   * The entity does not create or set this property. This must be set by the Transform component implementation during initialization phase.
   *
   * The application should always provide a transform component when creating an entity and it should be the first one added.
   */
  public transform: Transform

  private componentByType = new Map<any, GameComponent>()
  private typeByComponent = new Map<GameComponent, any>()
  // all known components that are controlled by this entity
  private components: GameComponent[] = []
  // components that are not initialized yet
  private toInitialize: GameComponent[] = []
  // components that are initialized but not enabled yet
  private toActivate: GameComponent[] = []
  // components that are initialized and enabled and ready for action
  private activated: GameComponent[] = []
  // systems that are provided by this entity
  private provides: GameSystem[] = []

  public get componentCount() {
    return this.components.length
  }

  public get active() {
    return this.state === EntityState.Activated
  }

  public get destroyed() {
    return this.state === EntityState.Destroyed
  }

  /**
   * Initializes this entity by calling initialize on all components.
   * This can be called only once in the lifetime of the entity.
   *
   * @throws Error if the entity is already initialized.
   */
  public initialize(game: GameProvider): this {
    if (this.state != EntityState.Created) {
      throw new Error('Entity is already initialized')
    }

    this.state = EntityState.Initializing
    this.provider = new GameProvider(game).initialize()
    if (this.provides.length) {
      for (const system of this.provides) {
        this.provider.addSystem(system)
      }
    }

    while (this.toInitialize.length > 0) {
      const component = this.toInitialize.shift()
      if (initializeComponent(component, this)) {
        this.toActivate.push(component)
      }
    }

    this.state = EntityState.Initialized

    if (!this.transform) {
      console.warn('Entity was initialized without a transform component')
    }

    return this
  }

  /**
   * Activates all components owned by this entity.
   *
   * @remarks
   * - Can be called multiple times during the lifetime of the entity.
   * - Can be called only when the entity is in the initialized state.
   */
  public activate(): this {
    if (this.state != EntityState.Initialized) {
      throw new Error('Entity must be in initialized state to be activated')
    }
    this.state = EntityState.Activating
    while (this.toActivate.length > 0) {
      const component = this.toActivate.shift()
      activateComponent(component)
      this.activated.push(component)
    }
    this.state = EntityState.Activated
    return this
  }

  /**
   * Deactivates all components owned by this entity.
   *
   * @remarks
   * - Can be called multiple times during the lifetime of the entity.
   * - Can be called only when the entity is in the activated state.
   */
  public deactivate(): this {
    if (this.state === EntityState.Initialized) {
      return this
    }
    if (this.state != EntityState.Activated) {
      throw new Error('Entity must be in activated state to be deactivated')
    }
    this.state = EntityState.Deactivating
    while (this.activated.length > 0) {
      const component = this.activated.shift()
      deactivateComponent(component)
      this.toActivate.push(component)
    }
    this.state = EntityState.Initialized
    return this
  }

  /**
   * Deactivates this entity and destroys all components.
   */
  public destroy(): this {
    this.deactivate()
    this.state = EntityState.Destroying
    for (const component of this.components) {
      destroyComponent(component)
    }
    this.state = EntityState.Destroyed
    return this
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
    return this.componentByType.has(type)
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
  public addComponent<T extends GameComponent>(component: GameComponent, type?: GameComponentType<T> | null): this {
    if (type === undefined && component.constructor) {
      if (component.constructor === Object) {
        throw new Error('Plain objects must have an explicit type provided when added as components')
      }
      type = component.constructor as GameComponentType<T>
    }

    if (this.state >= EntityState.Activated) {
      throw new Error('Cannot add component while entity is active')
    }
    if (this.components.includes(component)) {
      console.warn('Component already added to entity', component)
      return this
    }
    if (type != null) {
      if (this.componentByType.has(type)) {
        throw new Error(`Component of type ${getTypeName(type)} already exists`)
      }
      this.componentByType.set(type, component)
      this.typeByComponent.set(component, type)
    }
    this.components.push(component)
    switch (this.state) {
      case EntityState.Created:
      case EntityState.Initializing:
        this.toInitialize.push(component)
        break
      case EntityState.Initialized:
      case EntityState.Activating:
        if (initializeComponent(component, this)) {
          this.toActivate.push(component)
        }
        break
    }
    return this
  }

  /**
   * Removes a component from the entity. Removes its reference from the 'by type' lookup registry.
   */
  public removeComponent(component: GameComponent) {
    if (this.state >= EntityState.Activated) {
      throw new Error('Cannot remove component while entity is active')
    }
    removeFromArray(this.components, component)
    removeFromArray(this.toInitialize, component)
    removeFromArray(this.toActivate, component)
    const type = this.typeByComponent.get(component)
    if (type) {
      this.componentByType.delete(type)
      this.typeByComponent.delete(component)
    }
    component.entity = null
  }

  /**
   * Looks up a component by type on the entity
   * @throws Error if the component is not found in the entity
   */
  public component<T extends GameComponent>(type: GameComponentType<T>, optional?: boolean): T {
    if (this.componentByType.has(type)) {
      return this.componentByType.get(type) as T
    }
    if (optional) {
      return null
    }
    throw new Error(`Component of type ${getTypeName(type)} not found`)
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
   * Before initialization, sets the game systems that should be provided directly by this entity.
   *
   * @param systems
   * @returns
   */
  public provide(...systems: GameSystem[]): this {
    if (this.state != EntityState.Created) {
      throw new Error('Cannot set systems after entity is created')
    }
    this.provides = this.provides || []
    for (const system of systems) {
      if (this.provides.includes(system)) {
        throw new Error(`System ${getTypeName(system)} already provided by this entity`)
      }
      this.provides.push(system)
    }
    return this
  }
}

function removeFromArray<T>(array: T[], item: T) {
  const index = array.indexOf(item)
  if (index > -1) {
    array.splice(index, 1)
  }
}

function initializeComponent(component: GameComponent, entity: GameEntity) {
  try {
    component.initialize(entity)
  } catch (e) {
    console.error('Error initializing component', component, e)
    return false
  }
  return true
}

function activateComponent(component: GameComponent) {
  try {
    component.activate()
  } catch (e) {
    console.error('Error enabling component', component, e)
    return false
  }
  return true
}

function deactivateComponent(component: GameComponent) {
  try {
    component.deactivate()
  } catch (e) {
    console.error('Error disabling component', component, e)
    return false
  }
  return true
}

function destroyComponent(component: GameComponent) {
  try {
    component.destroy()
  } catch (e) {
    console.error('Error destroying component', component, e)
    return false
  }
  return true
}

function getTypeName(type: any): string {
  if (typeof type === 'function') {
    return type.name
  } else if (typeof type === 'string') {
    return type
  } else {
    return String(type)
  }
}
