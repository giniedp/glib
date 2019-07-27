import { Events, Type, Log } from '@gglib/utils'
import { Component } from './Component'
import { getInjectMetadata, getServiceMetadata } from './decorators'
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

  private constructor(scope: Entity) {
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
   */
  public getService<T>(key: Type<T>, fallback?: T): T
  /**
   * Gets a service for given key
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
    errorOnMissingService(key)
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
    // tslint:disable-next-line: prefer-for-of
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

    this.injectEntity(comp)
    this.registerService(comp)

    // Run life cycle
    if (comp.onAdded) {
      comp.onAdded(this)
    }
    return this
  }

  /**
   * Removes the component from this entity.
   */
  public removeComponent(comp: Component): Entity {
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

    this.ejectServices(comp)
    this.unregisterService(comp)

    // Run life cycle
    if (isRemoved && comp.onRemoved) {
      comp.onRemoved(this)
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
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < this.children.length; i++) {
      this.children[i].initializeComponents(recursive)
    }
    return this
  }

  /**
   * Calls `onUpdate` on each attached component
   *
   * @param recursive - Whether to continue the update call recursively on every child
   */
  public updateComponents(time: number, recursive: boolean = true): void {
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < this.toUpdate.length; i++) {
      this.toUpdate[i].onUpdate(time)
    }
    if (!recursive) {
      return
    }
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < this.children.length; i++) {
      this.children[i].updateComponents(time, recursive)
    }
  }

  /**
   * Calls `onDraw` on each attached component
   *
   * @param time - The current game time
   * @param recursive - Whether to continue the draw call recursively on every child
   */
  public drawComponents(time: number, recursive: boolean = true): void {
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < this.toDraw.length; i++) {
      this.toDraw[i].onDraw(time)
    }
    if (!recursive) {
      return
    }
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < this.children.length; i++) {
      this.children[i].drawComponents(time, recursive)
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
   * Gets all descendant of this entity
   *
   * @param includeSelf - pass `true` to include this entity in the result set
   * @param result - a collection where the results should be added to
   */
  public descendants(includeSelf: boolean = false, result: Entity[] = []) {
    if (includeSelf) {
      result.push(this)
    }
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < this.children.length; i++) {
      this.children[i].descendants(true, result)
    }
    return result
  }

  /**
   * Gets all siblings of this entity
   *
   * @param includeSelf - pass `true` to include this entity in the result set
   * @param result - a collection where the results should be added to
   */
  public siblings(includeSelf: boolean = false, result: Entity[] = []) {
    if (!this.parent) {
      if (includeSelf) {
        result.push(this)
      }
      return result
    }
    const c = this.parent.children
    // tslint:disable-next-line: prefer-for-of
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
   * ```
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
        component[m.property] = this[m.from] as Entity || this
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
      let source: Entity
      switch (m.from) {
        case 'root':
          source = this.root
          break
        case 'parent':
          source = this.parent
          break
        default:
          source = m.from ? this.find(m.from) : this
          break
      }
      if (!source) {
        Log.w('[Entity]', `unable to inject service from '${m.from}'. Entity is not available.`)
      } else {
        component[m.property] = source.getService(m.service)
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
    let target: Entity
    switch (meta.on) {
      case 'root':
        target = this.root
        break
      case 'parent':
        target = this.parent
        break
      default:
        target = meta.on ? this.find(meta.on) : this
        break
    }
    if (!target) {
      Log.w('[Entity]', `unable to register service on '${meta.on}'. Entity is not available.`)
    } else {
      target.addService(meta.as, component, true)
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
    let target: Entity
    switch (meta.on) {
      case 'root':
        target = this.root
        break
      case 'parent':
        target = this.parent
        break
      default:
        target = meta.on ? this.find(meta.on) : this
        break
    }
    if (!target) {
      Log.w('[Entity]', `unable to unregister service on '${meta.on}'. Entity is not available.`)
    } else {
      target.removeService(meta.as)
    }
  }
}
