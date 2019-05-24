import { Events, extend, isArray, isObject, isString, Log } from '@gglib/core'
import { Component } from './Component'
import * as Components from './components'
import { find, findAll } from './finder'
import { getTemplate, TemplateFunction, TemplateMap, TemplateOptions } from './Template'
import { Visitor } from './Visitor'

/**
 * An object that holds a collection of components a collection of services and a collection of child nodes.
 *
 * @public
 */
export class Entity extends Events {

  /**
   * The name of this entity
   */
  public name: string = 'Entity'

  /**
   * The parent entity
   */
  public parent: Entity = null

  /**
   * The root entity
   */
  public root: Entity = null

  /**
   * Collection of service components.
   */
  public readonly services: { [key: string]: Component } = {}

  /**
   * Collection of all components of this node. Components are updated each frame.
   */
  public readonly components: Component[] = []

  /**
   * Collection of child entities. This property should only be used to iterate over child nodes. Do not add or
   * remove items to or from this collection.
   */
  public readonly children: Entity[] = []

  private toDraw: Component[] = []
  private toUpdate: Component[] = []
  private toInitialize: Component[] = []

  constructor(params: any = {}) {
    super()
    this.root = this
    extend(this, params)
  }

  /**
   * Allows to iterate through the entity tree using the visitor pattern.
   */
  public acceptVisitor(visitor: Visitor<Entity>) {
    visitor.visit(this)
    for (const node of this.children) {
      node.acceptVisitor(visitor)
    }
  }

  public applyTemplates(...config: Array<string|TemplateFunction|TemplateMap>) {
    for (const item of config) {
      if (Array.isArray(item)) {
        this.applyTemplates(item)
      } else if (typeof item === 'object') {
        Object.keys(item).forEach((name) => {
          this.applyTemplate(name, item[name])
        })
      } else if (typeof item === 'string' || typeof item === 'function') {
        this.applyTemplate(item)
      }
    }
    return this
  }

  public applyTemplate(nameOrTemplate: string|TemplateFunction, options?: TemplateOptions): this {
    if (typeof nameOrTemplate === 'string') {
      getTemplate(nameOrTemplate)(this, options)
    } else {
      nameOrTemplate(this, options)
    }
    return this
  }

  /**
   * Binds a service object to this node that is accessible by the given name.
   *
   * @remarks A service may be anything i.e. object, array, function or primitive data.
   * However the name must be unique for all services within a single node.
   *
   * Although any node is allowed to own services it is often simpler to let
   * the root node to hold the services.
   */
  public addService(name: string, service: any, override?: boolean): this {
    const oldService = this.services[name]
    if (oldService) {
      if (override) {
        this.removeService(name)
      } else {
        throw new Error(`Service '${name}' is already registered`)
      }
    }
    this.services[name] = service
    return this
  }

  /**
   * Removes a service by given service name.
   */
  public removeService(name: string): Entity {
    delete this.services[name]
    return this
  }

  /**
   * Gets a service by name. Throws an error if service is missing
   */
  public getService(name: 'Assets'): Components.AssetsComponent
  public getService(name: 'Camera'): Components.CameraComponent
  public getService(name: 'Fps'): Components.FpsComponent
  public getService(name: 'GameLoop'): Components.GameLoopComponent
  public getService(name: 'Keyboard'): Components.KeyboardComponent
  public getService(name: 'Light'): Components.LightComponent
  public getService(name: 'Mouse'): Components.MouseComponent
  public getService(name: 'Renderable'): Components.Renderable
  public getService(name: 'Renderer'): Components.RendererComponent
  public getService(name: 'Time'): Components.TimeComponent
  public getService(name: 'Transform'): Components.TransformComponent
  public getService(name: string): any
  public getService(name: any): any {
    const result = this.services[name]
    if (!result) {
      throw new Error(`Service '${name}' is missing`)
    }
    return result
  }

  public getServices<T>(map: { [k in keyof T]: string }, target?: T): T {
    if (!target) {
      target = {} as any
    }
    for (const key of Object.keys(map)) {
      target[key] = this.getService(map[key])
    }
    return target
  }

  /**
   * Adds a child node and creates a parent child relationship
   */
  public addEntity(entity: Entity): this {
    if (entity.parent) {
      entity.parent.removeEntity(entity)
    }
    this.children.push(entity)
    entity.parent = this
    entity.root = this.root
    return this
  }

  /**
   * Creates and adds a new child entity and passes it to each of the given template functions.
   */
  public buildEntity(...config: Array<string|TemplateFunction|TemplateMap>): this {
    const child = new Entity()
    this.addEntity(child)
    child.applyTemplates(config)
    return this
  }

  /**
   * calls addChild on `parent`
   */
  private addTo(parent: Entity): this {
    parent.addEntity(this)
    return this
  }

  /**
   * Removes the given node from the child collection and breaks the parent child relation ship
   */
  public removeEntity(entity: Entity): this {
    const index = this.children.indexOf(entity)
    if (index >= 0) {
      this.children.splice(index, 1)
      entity.parent = null
    }
    return this
  }

  /**
   * Removes this entity from its parent
   */
  public remove() {
    if (this.parent) {
      this.parent.removeEntity(this)
    }
  }

  /**
   * Adds a component to this node. If the component has a `serviceName` property it is also registered as a service.
   */
  public addComponent(comp: Component): Entity {
    if (comp.entity) {
      comp.entity.removeComponent(comp)
    }
    comp.entity = this
    if (comp.service && comp.name) {
      this.addService(comp.name, comp)
    }

    if (this.components.indexOf(comp) < 0) {
      this.components.push(comp)
    }
    if (this.toInitialize.indexOf(comp) < 0) {
      this.toInitialize.push(comp)
    }

    return this
  }

  /**
   * Removes the component from this node.
   */
  public removeComponent(comp: Component): Entity {
    if (comp.service && comp.name) {
      delete this.services[comp.name]
    }
    let index = this.components.indexOf(comp)
    if (index >= 0) {
      this.components.splice(index, 1)
      comp.entity = null
    }
    index = this.toUpdate.indexOf(comp)
    if (index >= 0) {
      this.toUpdate.splice(index, 1)
    }
    index = this.toDraw.indexOf(comp)
    if (index >= 0) {
      this.toDraw.splice(index, 1)
    }
    return this
  }

  /**
   * Instantly initializes the components and brings the node into a fully functional state. This method does not
   * need to be called because the components are initialized the first time the node is updated. This is usually
   * in the next frame after the frame the components have been added to the node.
   */
  public commitComponents(): Entity {
    this.initializeComponents(false)
    return this
  }

  /**
   *
   */
  public initializeComponents(recursive: boolean = true): void {
    let cmp
    while (this.toInitialize.length > 0) {
      cmp = this.toInitialize.shift()
      if (typeof cmp.setup === 'function') {
        cmp.setup(this)
        cmp.initialized = true
      }
      if (typeof cmp.update === 'function' && this.toUpdate.indexOf(cmp) < 0) {
        this.toUpdate.push(cmp)
      }
      if (typeof cmp.draw === 'function' && this.toDraw.indexOf(cmp) < 0) {
        this.toDraw.push(cmp)
      }
    }
    if (recursive !== false) {
      for (const node of this.children) {
        node.initializeComponents(recursive)
      }
    }
  }

  /**
   *
   */
  public updateComponents(time: number, recursive: boolean = true): void {
    const list = this.toUpdate
    for (const cmp of list) {
      if (cmp.enabled !== false) {
        cmp.update(time)
      }
    }
    if (recursive !== false) {
      for (const node of this.children) {
        node.updateComponents(time, recursive)
      }
    }
  }

  /**
   *
   */
  public drawComponents(time: number, recursive: boolean = true): void {
    const list = this.toDraw
    for (const cmp of list) {
      if (cmp.visible !== false) {
        cmp.draw(time)
      }
    }
    if (recursive !== false) {
      for (const node of this.children) {
        node.drawComponents(time, recursive)
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
   * Gets all descendant of this node
   */
  public descendants(andSelf: boolean = false, result: Entity[] = []) {
    if (andSelf) {
      result.push(this)
    }
    for (const node of this.children) {
      node.descendants(true, result)
    }
    return result
  }

  /**
   * Gets all siblings of this node
   */
  public siblings(andSelf: boolean, result: Entity[] = []) {
    if (!this.parent) {
      if (andSelf) {
        result.push(this)
      }
      return result
    }
    const nodes = this.parent.children
    for (const node of nodes) {
      if (node !== this || andSelf) {
        result.push(node)
      }
    }
    return result
  }
}
