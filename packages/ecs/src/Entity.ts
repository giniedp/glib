import { Events, Type } from '@gglib/utils'
import { Component } from './Component'
import { getInjectMetadata, getServiceMetadata } from './decorators'
import { find, findAll } from './finder'

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

  constructor() {
    super()
    this.root = this
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
  public getService<T>(key: any, fallback?: T): T
  public getService(key: any, fallback?: any) {
    const result = this.services.get(key)
    if (result == null && fallback !== undefined) {
      return fallback
    }
    if (result == null) {
      throw new Error(`Service '${key}' is missing`)
    }
    return result
  }

  /**
   * Adds a child entity and creates a parent child relationship
   */
  public addChild(entity: Entity): this {
    if (entity.parent) {
      entity.parent.removeChild(entity)
    }
    (this.children as Entity[]).push(entity);
    (entity as { parent: Entity }).parent = this;
    (entity as { root: Entity }).root = this.root
    return this
  }

  /**
   * Creates and adds a new child entity and passes it to the given callback
   */
  public createChild(...callbacks: Array<(entity: Entity) => void>): this {
    const child = new Entity()
    this.addChild(child)
    for (const cb of callbacks) {
      cb(child)
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
   * Removes the given entity from the child collection and breaks the parent child relation ship
   */
  public removeChild(entity: Entity): this {
    const index = this.children.indexOf(entity)
    if (index >= 0) {
      (this.children as Entity[]).splice(index, 1);
      (entity as { parent: Entity }).parent = null
    }
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

    // Bind to entity
    // TODO: find a way to store a component->entity relation without
    // writing to the component object
    if (comp['$$boundEntity']) {
      (comp['$$boundEntity'] as Entity).removeComponent(comp)
    }
    comp['$$boundEntity'] = this

    // Add to update lists
    if (this.components.indexOf(comp) < 0) {
      (this.components as Component[]).push(comp)
    }
    if (this.toInitialize.indexOf(comp) < 0) {
      this.toInitialize.push(comp)
    }

    this.injectEntity(comp)
    this.registerServices(comp)

    // Run life cycle
    if (typeof comp.onAdded === 'function') {
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
      comp['$$boundEntity'] = null
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
    this.unregisterServices(comp)

    // Run life cycle
    if (isRemoved && typeof comp.onRemoved === 'function') {
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

      // Run life cycle
      if (typeof cmp.onInit === 'function') {
        cmp.onInit(this)
      }
      if (typeof cmp.onUpdate === 'function' && this.toUpdate.indexOf(cmp) < 0) {
        this.toUpdate.push(cmp)
      }
      if (typeof cmp.onDraw === 'function' && this.toDraw.indexOf(cmp) < 0) {
        this.toDraw.push(cmp)
      }
    }

    if (recursive) {
      for (const it of this.children) {
        it.initializeComponents(recursive)
      }
    }
    return this
  }

  /**
   * Calls `onUpdate` on each attached component
   *
   * @param time - The current game time
   * @param recursive - Whether to continue the update call recursively on every child
   */
  public updateComponents(time: number, recursive: boolean = true): void {
    for (const cmp of this.toUpdate) {
      cmp.onUpdate(time)
    }
    if (recursive) {
      for (const it of this.children) {
        it.updateComponents(time, recursive)
      }
    }
  }

  /**
   * Calls `onDraw` on each attached component
   *
   * @param time - The current game time
   * @param recursive - Whether to continue the draw call recursively on every child
   */
  public drawComponents(time: number, recursive: boolean = true): void {
    for (const cmp of this.toDraw) {
      cmp.onDraw(time)
    }
    if (recursive) {
      for (const it of this.children) {
        it.drawComponents(time, recursive)
      }
    }
  }

  /**
   * Finds the objects that match the given expression.
   */
  public findAll(query: string) {
    return findAll(query, this)
  }

  /**
   * Finds the first object that matches the given expression.
   */
  public find(query: string) {
    return find(query, this)
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
    for (const it of this.children) {
      it.descendants(true, result)
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
    for (const it of this.parent.children) {
      if (it !== this || includeSelf) {
        result.push(it)
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
    if (meta) {
      meta.forEach((m) => {
        if (m.service === Entity) {
          m.target[m.property] = this[m.from] as Entity || this
        }
      })
    }
  }

  private injectServices(component: Component) {
    const meta = getInjectMetadata(component)
    if (meta) {
      meta.forEach((m) => {
        if (m.service !== Entity) {
          m.target[m.property] = (this[m.from] as Entity || this).getService(m.service)
        }
      })
    }
  }

  private ejectServices(component: Component, which?: 'root' | 'parent' | 'self') {
    const meta = getInjectMetadata(component)
    if (meta) {
      meta.forEach((m) => {
        if (!which || which === m.from) {
          m.target[m.property] = null
        }
      })
    }
  }

  private registerServices(component: Component) {
    const sMeta = getServiceMetadata(component)
    if (sMeta) {
      (this[sMeta.at] as Entity || this).addService(sMeta.as, component)
    }
  }

  private unregisterServices(component: Component, which?: 'root' | 'parent' | 'self') {
    const m = getServiceMetadata(component)
    if (m && (!which || which === m.at)) {
      (this[m.at] as Entity || this).removeService(m.as)
    }
  }
}
