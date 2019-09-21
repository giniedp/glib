import { Events, Log, Type } from '@gglib/utils'
import { Component } from './Component'
import { getInjectMetadata, getListenerMetadata, getServiceMetadata, ListenerMetadata } from './decorators'
import { errorOnMissingService } from './errors'
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
   * This serves no purpose for this library and can be changed at any time
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
   * A collection of services
   */
  public readonly services: ReadonlyMap<any, any> = new Map()

  /**
   * A collection of all attached components
   *
   * @remarks
   * To register and remove components from an entity use {@link Entity.addComponent} and {@link Entity.removeComponent} methods
   */
  public readonly components: ReadonlyArray<Component> = []

  /**
   * A collection of child entities
   *
   * @remarks
   * To add or remove entities use {@link Entity.addChild} and {@link Entity.addChild} methods
   */
  public readonly children: ReadonlyArray<Entity> = []

  private toDraw: Component[] = []
  private toUpdate: Component[] = []
  private toInitialize: Component[] = []

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
   * Adds a service object to this entity
   */
  public addService<T>(key: Type<T>, service: T, override?: boolean): this
  /**
   * Adds a service object to this entity
   */
  public addService<T>(key: string, service: any, override?: boolean): this
  public addService(key: any, service: any, override?: boolean): this {
    if (this.services.has(key)) {
      if (override) {
        this.removeService(key)
      } else {
        throw new Error(`Service '${key}' is already registered`)
      }
    }
    (this.services as Map<any, any>).set(key, service)
    return this
  }

  /**
   * Removes a service by given key.
   */
  public removeService(key: any): boolean {
    return (this.services as Map<any, any>).delete(key)
  }

  /**
   * Gets a service for given key
   *
   * @param key - the key to lookup
   * @param fallback - the fallback value to return.
   */
  public getService<T>(key: Type<T>, fallback?: T): T
  /**
   * Gets a service for given key
   *
   * @param key - the key to lookup
   * @param fallback - the fallback value to return.
   */
  public getService<T>(key: any, fallback?: T): T // tslint:disable-line: unified-signatures
  public getService(key: any, fallback?: any) {
    const result = this.services.get(key)
    if (result != null) {
      return result
    }
    if (fallback !== undefined) {
      return fallback
    }
    errorOnMissingService(key, this)
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
    (this.children as Entity[]).push(entity);
    (entity as { parent: Entity }).parent = this

    for (const cmp of entity.components) {
      this.registerService(cmp, 'parent')
      this.injectServices(cmp, 'parent')
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
      this.ejectServices(cmp, 'parent')
      this.unregisterService(cmp, 'parent')
      if (cmp.onDetach) {
        cmp.onDetach(entity)
      }
    }

    (this.children as Entity[]).splice(index, 1);
    (entity as { parent: Entity }).parent = null
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

  /**
   * Adds a component to this entity
   *
   * @remarks
   * The added component will be marked for initialization which will happen
   * on next update turn.
   *
   * If the component implements the {@link @gglib/ecs#OnAdded} life cycle this
   * will be called at the end of this function.
   */
  public addComponent(comp: Component): Entity {
    if (comp[boundEntity]) {
      (comp[boundEntity] as Entity).removeComponent(comp)
    }
    comp[boundEntity] = this

    // Add to update lists
    if (this.components.indexOf(comp) < 0) {
      (this.components as Component[]).push(comp)
    }
    if (this.toInitialize.indexOf(comp) < 0) {
      this.toInitialize.push(comp)
    }

    // Inject the entity before the 'onAdded' lifecycle
    // so during 'onAdded' the component has an entity
    // to work with.
    this.injectEntity(comp)
    // It is also safe to register this component as a
    // service at this stage
    this.registerService(comp)
    // However, we can not inject further dependencies
    // right now since the entity/component tree might be
    // incomplete as it might be in the 'design' state.
    // We have to defer the dependency injection up
    // until the 'initializeComponents' stage

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
  public removeComponent(comp: Component): this {
    let isRemoved = false

    // Unbind
    let index = this.components.indexOf(comp)
    if (index >= 0) {
      (this.components as Component[]).splice(index, 1)
      comp[boundEntity] = null
      isRemoved = true
    }

    // Unregister from update lists
    index = this.toUpdate.indexOf(comp)
    if (index >= 0) {
      this.toUpdate.splice(index, 1)
    }
    index = this.toDraw.indexOf(comp)
    if (index >= 0) {
      this.toDraw.splice(index, 1)
    }

    // Run life cycle
    if (isRemoved && comp.onRemoved) {
      comp.onRemoved(this)
    }

    // Lastly eject all automatically injected services
    // Doing this after and not before 'onRemove'
    // allows the component to say goodbye to its
    // services before they are ejected
    this.ejectServices(comp)
    this.unregisterService(comp)
    this.removeEventListeners(comp)

    return this
  }

  /**
   * Removes the component and calls the `onDestroy` lifecycle
   *
   * @param comp - the component to remove
   */
  public destroyComponent(comp: Component): this {
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
    let cmp: Component
    while (this.toInitialize.length > 0) {
      cmp = this.toInitialize.shift()

      this.injectServices(cmp)
      this.addEventListeners(cmp)

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

    if (!recursive) {
      return this
    }
    for (let i = 0; i < this.children.length; i++) {
      this.children[i].initializeComponents(recursive)
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

  private injectEntity(component: Component) {
    const meta = getInjectMetadata(component)
    if (!meta) {
      return
    }
    meta.forEach((m) => {
      if (m.service === Entity) {
        component[m.property] = this.resolveEntity(m.from)
      }
    })
  }

  private ejectEntity(component: Component) {
    const meta = getInjectMetadata(component)
    if (!meta) {
      return
    }
    meta.forEach((m) => {
      if (m.service === Entity) {
        component[m.property] = null
      }
    })
  }

  private injectServices(component: Component, from?: 'root' | 'parent') {
    const meta = getInjectMetadata(component)
    if (!meta) {
      return
    }
    meta.forEach((m) => {
      if (m.service === Entity) {
        return
      }
      if (from && m.from !== from) {
        return
      }
      const source = this.resolveEntity(m.from)
      if (source) {
        const service = source.getService(m.service, null)
        if (service) {
          component[m.property] = service
        } else if (!m.optional) {
          errorOnMissingService(m.service, source, component)
        }
      } else {
        Log.w('[Entity]', `unable to inject service from '${m.from}'. Entity is not available.`)
      }
    })
  }

  private ejectServices(component: Component, from?: 'root' | 'parent') {
    const meta = getInjectMetadata(component)
    if (!meta) {
      return
    }
    meta.forEach((m) => {
      if (!from || from === m.from) {
        component[m.property] = null
      }
    })
  }

  private registerService(component: Component, on?: 'root' | 'parent') {
    const meta = getServiceMetadata(component)
    if (!meta) {
      return
    }
    if (on && meta.on !== on) {
      return
    }
    const target = this.resolveEntity(meta.on)
    if (target) {
      target.addService(meta.as, component, true)
    } else {
      Log.w('[Entity]', `unable to register service on '${meta.on}'. Entity is not available.`)
    }
  }

  private unregisterService(component: Component, on?: 'root' | 'parent') {
    const meta = getServiceMetadata(component)
    if (!meta) {
      return
    }
    if (on && meta.on !== on) {
      return
    }
    const target = this.resolveEntity(meta.on)
    if (target) {
      target.removeService(meta.as)
    } else {
      Log.w('[Entity]', `unable to unregister service on '${meta.on}'. Entity is not available.`)
    }
  }

  private addEventListeners(component: Component) {
    const meta = getListenerMetadata(component)
    if (!meta) {
      return
    }
    meta.forEach((m: ListenerMetadata) => {
      const target = this.resolveEntity(m.on)
      target.on(m.event, m.handler, component)
    })
  }

  private removeEventListeners(component: Component) {
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
}
