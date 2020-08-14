import { Events, Log, Type, TypeWithEmptyConstructor, addToArraySet, removeFromArray } from '@gglib/utils'
import { EntityComponent, OnSetup, OnSetupOptions } from './EntityComponent'
import {
  getInjectMetadata,
  getListenerMetadata,
  getComponentMetadata,
  ListenerMetadata,
  ComponentMetadataOptions,
  decorateComponent,
} from './decorators'
import { errorOnMissingDependency, errorOnInstallNoMetadata, errorOnMultipleInstancesOfSingletonComponent } from './errors'
import { Query } from './query'

const query = new Query()
const boundEntity = Symbol('boundEntity')

/**
 * An object that holds a collection of components a collection of services and a collection of child entities.
 *
 * @public
 */
export class Entity extends Events {
  /**
   * A user defined name
   *
   * @remarks
   * This is used to query components by name
   */
  public name: string = 'Entity'

  /**
   * A user defined object
   *
   * @remarks
   * This serves no purpose for this library and can be changed at any time
   */
  public tag: any = null

  /**
   * The root entity
   */
  public readonly root: Entity

  /**
   * Indicates whether this entity is a root entity
   */
  public get isRoot() {
    return this.root === this
  }

  /**
   * The parent entity
   */
  public readonly parent: Entity = null

  /**
   * A collection of all attached components
   *
   * @remarks
   * To register and remove components from an entity use {@link Entity.addComponent} and {@link Entity.removeComponent} methods
   */
  public readonly components: ReadonlyArray<EntityComponent> = []

  /**
   * A collection of child entities
   *
   * @remarks
   * To add or remove entities use {@link Entity.addChild} and {@link Entity.addChild} methods
   */
  public readonly children: ReadonlyArray<Entity> = []

  private toDraw: EntityComponent[] = []
  private toUpdate: EntityComponent[] = []
  private toInitialize: EntityComponent[] = []
  private provider: Map<any, EntityComponent[]> = new Map()

  protected constructor(scope?: Entity) {
    super()
    this.root = scope || this
  }

  /**
   * Creates a new root entity
   *
   * @remarks
   * The created entity has the `root` property set to itself.
   * That makes it a root entity and it can never be added as a child.
   */
  public static createRoot() {
    return new Entity(null)
  }

  /**
   * Gets a component for given key
   *
   * @param key - the key to lookup
   * @param fallback - the fallback value to return.
   */
  public get<T>(key: Type<T>, fallback?: T): T
  /**
   * Gets a component for given key
   *
   * @param key - the key to lookup
   * @param fallback - the fallback value to return.
   */
  public get<T>(key: any, fallback?: T): T
  public get(key: any, fallback?: any) {
    const result = this.provider.get(key)?.[0]
    if (result != null) {
      return result
    }
    if (fallback !== undefined) {
      return fallback
    }
    throw errorOnMissingDependency(key, this)
  }

  public getMulti(key: any): ReadonlyArray<EntityComponent> {
    return this.provider.get(key)
  }

  /**
   * Checks if a component is registered with given key.
   *
   * @param key - the key to lookup
   */
  public has(key: any) {
    return !!this.provider.get(key)?.length
  }

  /**
   * Creates and adds a new child entity.
   *
   * @remarks
   * The created child is not returned. Use a callback to access
   * and populate the created entity.
   * @param callbacks - The callbacks to call with the new child entity
   */
  public createChild(...callbacks: Array<(entity: Entity) => void>): this {
    const child = new Entity(this.root)
    this.addChild(child)
    for (let i = 0; i < callbacks.length; i++) {
      callbacks[i](child)
    }
    return this
  }

  /**
   * Adds this to the given parent
   */
  private addTo(parent: Entity): this {
    parent.addChild(this)
    return this
  }

  /**
   * Adds a child entity and creates a parent child relationship
   *
   * @remarks
   * Entities can not leave their root scope. Thus the given entity
   * must have the same root entity as its new parent. Otherwise
   * an error is thrown.
   *
   * The entity will be removed from its current parent if it already
   * has one.
   */
  public addChild(entity: Entity): this {
    if (entity.root !== this.root) {
      throw new Error('Child entities must belong to the same root')
    }
    if (entity === this) {
      throw new Error('An entity can not be a child of itself')
    }
    if (entity.isRoot) {
      throw new Error('A root entity can not be added as a child')
    }
    if (entity.parent === this) {
      return
    }
    if (entity.parent) {
      entity.parent.removeChild(entity)
    }
    ;(this.children as Entity[]).push(entity)
    ;(entity as { parent: Entity }).parent = this

    for (const cmp of entity.components) {
      this.injectDependencies(cmp, 'parent')
      if (cmp.onAttached) {
        cmp.onAttached(entity)
      }
    }

    return this
  }

  /**
   * Removes the given entity from the child collection and breaks the parent child relation ship
   */
  public removeChild(entity: Entity): this {
    const index = this.children.indexOf(entity)
    if (index === -1) {
      return this
    }

    for (const cmp of entity.components) {
      this.ejectDependencies(cmp, 'parent')
      if (cmp.onDetach) {
        cmp.onDetach(entity)
      }
    }

    ;(this.children as Entity[]).splice(index, 1)
    ;(entity as { parent: Entity }).parent = null
    return this
  }

  /**
   * Removes this entity from its parent
   */
  public remove() {
    if (this.parent) {
      this.parent.removeChild(this)
    }
  }

  /**
   * Destroys and removes all child entities
   */
  public destroyChildren() {
    while (this.children.length) {
      this.children[0].destroy()
    }
  }

  /**
   * Destroys and removes all child entities
   */
  public destroy() {
    while (this.children.length) {
      this.children[0].destroy()
    }
    this.destroyComponents()
    this.remove()
  }

  public install<T extends OnSetup>(type: TypeWithEmptyConstructor<T>, options: OnSetupOptions<T>): this
  public install<T extends EntityComponent>(type: TypeWithEmptyConstructor<T>): this
  /**
   * Creates and adds an instance of the given component type
   *
   * @remarks
   * If the given type has a Service() decorator, an instance will only be created
   * if this entity does not already have a service of that type.
   */
  public install<T extends EntityComponent>(type: TypeWithEmptyConstructor<T>, options?: any): this {
    const meta = getComponentMetadata(type)
    if (!meta) {
      throw errorOnInstallNoMetadata(type)
    }
    let component: EntityComponent = this.get(meta.as, null)
    const mustAdd = !component
    if (mustAdd) {
      component = new type()
    }
    if (options && component.onSetup) {
      component.onSetup(options)
    }
    if (mustAdd) {
      this.addComponent(component)
    }
    return this
  }

  /**
   * Adds a component instance to this entity
   *
   * @remarks
   * The added component will be marked for initialization which will happen
   * on next update turn.
   *
   * If the component implements the {@link @gglib/ecs#OnAdded} life cycle
   * it will be called at the end of this function.
   */
  public addComponent<T extends EntityComponent>(comp: T extends Function ? never : T): Entity {
    if (comp[boundEntity]) {
      ;(comp[boundEntity] as Entity).removeComponent(comp)
    }

    // Register the component on this entity
    this.registerComponent(comp)
    // Bind the entity to the component
    comp[boundEntity] = this
    addToArraySet(this.components as EntityComponent[], comp)

    // Push to the initialization list
    if (this.toInitialize.indexOf(comp) < 0) {
      this.toInitialize.push(comp)
    }

    // Create dependencies for the given component.
    this.installDependencies(comp)

    // Inject the entity before calling the 'onAdded' lifecycle
    this.injectEntity(comp)

    // Run life cycle
    if (comp.onAdded) {
      comp.onAdded(this)
    }
    return this
  }

  /**
   * Removes the given component from this entity
   *
   * @remarks
   * The following steps are performed for the removed component
   * - component is removed from components list
   * - `onRemove` life cycle is called
   * - component is unregistered from services list if it was a `@Service`
   * - `@Inject` bindings are unset
   * - `@Listener` callbacks are unregistered
   *
   * However the `onDestroy` lifecycle is not called. To do this use `destroyComponent`.
   */
  public removeComponent(comp: EntityComponent): this {
    const isRemoved = removeFromArray(this.components as EntityComponent[], comp)
    if (isRemoved) {
      comp[boundEntity] = null
    }

    // Unregister from update lists
    removeFromArray(this.toUpdate, comp)
    removeFromArray(this.toDraw, comp)
    removeFromArray(this.toInitialize, comp)

    // Run life cycle
    if (isRemoved && comp.onRemoved) {
      comp.onRemoved(this)
    }

    // Lastly eject all automatically injected services
    // Doing this after and not before 'onRemove'
    // allows the component to say goodbye to its
    // services before they are ejected
    this.ejectDependencies(comp)
    this.removeEventListeners(comp)
    this.unregisterComponent(comp)

    return this
  }

  /**
   * Removes the component and calls the `onDestroy` lifecycle
   *
   * @param comp - the component to remove
   */
  public destroyComponent(comp: EntityComponent): this {
    this.removeComponent(comp)
    if (comp.onDestroy) {
      comp.onDestroy(this)
    }
    return this
  }

  /**
   * Destroys and removes all components of this entity
   */
  public destroyComponents(): this {
    try {
      this.destroyComponent(this.components[0])
    } catch (e) {
      console.error(e)
    }
    return this
  }

  /**
   * Calls `onInit` on each attached component
   *
   * @param recursive - Whether to continue the initialization recursively on every child
   */
  public initializeComponents(recursive: boolean = true): this {
    let cmp: EntityComponent
    for (let i = 0; i < this.toInitialize.length; i++) {
      cmp = this.toInitialize[i]
      this.injectDependencies(cmp)
      this.addEventListeners(cmp)
    }

    while (this.toInitialize.length > 0) {
      cmp = this.toInitialize.shift()

      if (cmp.onUpdate && this.toUpdate.indexOf(cmp) < 0) {
        this.toUpdate.push(cmp)
      }
      if (cmp.onDraw && this.toDraw.indexOf(cmp) < 0) {
        this.toDraw.push(cmp)
      }
      // Run life cycle
      if (cmp.onInit) {
        cmp.onInit(this)
      }
    }

    if (recursive) {
      for (let i = 0; i < this.children.length; i++) {
        this.children[i].initializeComponents(recursive)
      }
    }
    return this
  }

  /**
   * Calls `onUpdate` on each attached component
   *
   * @param dt - The elapsed time since last update call
   * @param recursive - Whether to continue the update call recursively on every child
   */
  public updateComponents(dt: number, recursive: boolean = true): void {
    for (let i = 0; i < this.toUpdate.length; i++) {
      this.toUpdate[i].onUpdate(dt)
    }
    if (!recursive) {
      return
    }
    for (let i = 0; i < this.children.length; i++) {
      this.children[i].updateComponents(dt, recursive)
    }
  }

  /**
   * Calls `onDraw` on each attached component
   *
   * @param dt - The elapsed time since last draw call
   * @param recursive - Whether to continue the draw call recursively on every child
   */
  public drawComponents(dt: number, recursive: boolean = true): void {
    for (let i = 0; i < this.toDraw.length; i++) {
      this.toDraw[i].onDraw(dt)
    }
    if (!recursive) {
      return
    }
    for (let i = 0; i < this.children.length; i++) {
      this.children[i].drawComponents(dt, recursive)
    }
  }

  /**
   * Finds the objects that match the given expression.
   */
  public findAll(search: string, result?: Entity[]) {
    return query.findAll(this, search, result)
  }

  /**
   * Finds the first object that matches the given expression.
   */
  public find(search: string) {
    return query.findOne(this, search)
  }

  /**
   * Gets all descendants of this entity
   *
   * @param includeSelf - whether to include this entity in the result array
   * @param result - an array where the result is written to
   */
  public descendants(includeSelf: boolean = false, result: Entity[] = []) {
    if (includeSelf) {
      result.push(this)
    }
    for (let i = 0; i < this.children.length; i++) {
      this.children[i].descendants(true, result)
    }
    return result
  }

  /**
   * Gets all siblings of this entity
   *
   * @param includeSelf - whether to include this entity in the result array
   * @param result - an array where the result is written to
   */
  public siblings(includeSelf: boolean = false, result: Entity[] = []) {
    if (!this.parent) {
      if (includeSelf) {
        result.push(this)
      }
      return result
    }
    const c = this.parent.children
    for (let i = 0; i < c.length; i++) {
      if (c[i] !== this || includeSelf) {
        result.push(c[i])
      }
    }
    return result
  }

  /**
   * Taps this entity by calling the given function
   *
   * @example
   * ```ts
   * return new Entity().tap((entity) => {
   *   // modify entity
   * })
   * ```
   * @param cb - The callback to call
   */
  public tap(cb: (entity: this) => void): this {
    cb(this)
    return this
  }

  private injectEntity(component: EntityComponent) {
    const meta = getInjectMetadata(component)
    if (!meta) {
      return
    }
    meta.forEach((m) => {
      if (m.type === Entity) {
        component[m.property] = this.resolveEntity(m.from)
      }
    })
  }

  private ejectEntity(component: EntityComponent) {
    const meta = getInjectMetadata(component)
    meta?.forEach((m) => {
      if (m.type === Entity) {
        component[m.property] = null
      }
    })
  }

  private injectDependencies(component: EntityComponent, from?: 'root' | 'parent') {
    const meta = getInjectMetadata(component)
    meta?.forEach((m) => {
      if (m.type === Entity) {
        return
      }
      if (from && m.from !== from) {
        return
      }
      const source = this.resolveEntity(m.from)
      if (source) {
        const dep = source.get(m.type, null)
        if (dep) {
          component[m.property] = dep
        } else if (!m.optional) {
          throw errorOnMissingDependency(m.type, source, component)
        }
      } else {
        Log.warn('[Entity]', `unable to inject dependency from '${m.from}'. Entity is not available.`)
      }
    })
  }

  private ejectDependencies(component: EntityComponent, from?: 'root' | 'parent') {
    const meta = getInjectMetadata(component)
    meta?.forEach((m) => {
      if (!from || from === m.from) {
        component[m.property] = null
      }
    })
  }

  private registerComponent(component: EntityComponent) {
    const meta = getComponentMetadata(component)
    if (meta) {
      if (!meta.multi && this.has(meta.as)) {
        throw errorOnMultipleInstancesOfSingletonComponent(component)
      }
      let list = this.provider.get(meta.as)
      if (!list) {
        list = []
        this.provider.set(meta.as, list)
      }
      addToArraySet(list, component)
    }
  }

  private unregisterComponent(component: EntityComponent) {
    const meta = getComponentMetadata(component)
    if (meta) {
      let list = this.provider.get(meta.as)
      if (list) {
        removeFromArray(list, component)
      }
    }
  }

  private addEventListeners(component: EntityComponent) {
    const meta = getListenerMetadata(component)
    if (!meta) {
      return
    }
    meta.forEach((m: ListenerMetadata) => {
      const target = this.resolveEntity(m.on)
      target.on(m.event, m.handler, component)
    })
  }

  private removeEventListeners(component: EntityComponent) {
    const meta = getListenerMetadata(component)
    if (!meta) {
      return
    }
    meta.forEach((m: ListenerMetadata) => {
      const target = this.resolveEntity(m.on)
      target.off(m.event, m.handler, component)
    })
  }

  private resolveEntity(lookup: 'root' | 'parent' | string): Entity {
    if (!lookup) {
      return this
    }
    if (lookup === 'root') {
      return this.root
    }
    if (lookup === 'parent') {
      return this.parent
    }
    return this.find(lookup)
  }

  private installDependencies(component: EntityComponent) {
    const meta = getComponentMetadata(component)
    if (meta?.install.length) {
      for (const dep of meta.install) {
        this.install(dep)
      }
    }
  }
}
