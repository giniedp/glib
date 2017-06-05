import { Events, extend, isArray, isObject, isString, logger } from '@glib/core'
import { Component } from './Component'
import { Finder } from './Finder'
import { getTemplate, Template } from './Template'
import { Visitor } from './Visitor'
/**
 * An object that holds a collection of components a collection of services and a collection of child nodes.
 */
export class Entity extends Events {

  /**
   * The name of this node
   */
  public name: string = 'Entity'

  /**
   * The parent entity
   */
  public parent: Entity = null

  /**
   *
   */
  public root: Entity = null

  /**
   * Collection of service components.
   */
  public services: { [key: string]: Component } = {}

  /**
   * Shorthand for the `services` property
   */
  public get s(): { [key: string]: Component } {
    return this.services
  }

  /**
   * Collection of all components of this node. Components are updated each frame.
   */
  public components: Component[] = []

  /**
   * Shorthand for the `components` property
   */
  public get c(): Component[] {
    return this.components
  }

  /**
   * Collection of child entities. This property should only be used to iterate over child nodes. Do not add or
   * remove items to or from this collection.
   */
  public children: Entity[] = []

  private toDraw: Component[] = []
  private toUpdate: Component[] = []
  private toInitialize: Component[] = []
  private finder = new Finder()

  constructor(params: any = {}) {
    super()
    this.root = this
    extend(this, params)
  }

  /**
   * Allows to iterate through the entity tree using the visitor pattern.
   * @param visitor
   */
  public acceptVisitor(visitor: Visitor<Entity>) {
    visitor.visit(this)
    for (const node of this.children) {
      node.acceptVisitor(visitor)
    }
  }

  public applyTemplates(config: Array<string|Template|{name?: string, templates: any}>) {
    for (const item of config) {
      if (typeof item === 'string') {
        this.applyTemplate(item)
      } else if (typeof item === 'function') {
        this.applyTemplate(item)
      } else {
        this.name = item.name || this.name
        const templates = item.templates || []
        if (isArray(templates)) {
          for (const name of templates) {
            this.applyTemplate(name)
          }
        } else if (isObject(templates)) {
          for (const name in templates) {
            if (templates.hasOwnProperty(name)) {
              this.applyTemplate(name, templates[name])
            }
          }
        } else if (isString(templates)) {
          this.applyTemplate(templates)
        }
      }
    }
    return this
  }

  public applyTemplate(nameOrTemplate: string|Template, options?: any): Entity {
    if (typeof nameOrTemplate === 'string') {
      getTemplate(nameOrTemplate)(this, options)
    } else {
      nameOrTemplate(this, options)
    }
    return this
  }

  /**
   * Binds a service object to this node that is accessible by the given name. A service may be anything i.e.
   * object, array, function or primitive data. However the name must be unique for all services within a single node.
   * Although any node is allowed to have a collection of services it is often simpler and more effective to let
   * the app node (the window node) to hold the services.
   * @method addService
   * @param {String} name The name of the service
   * @param {*} service The service object
   * @param {Boolean} [override] Silently overrides an existing service.
   * @example
   *   node.addService('myService', { foo: 'bar' })
   */
  public addService(name: string, service: any, override?: boolean): Entity {
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
   * @param name The name of the service to remove
   * @returns {Glib.Entity}
   */
  public removeService(name: string): Entity {
    delete this.services[name]
    return this
  }

  /**
   * Gets a service object by name starting the search at this node. Without the recursive parameter the search will
   * end at this node and throw an exception if the no service was found.
   * @method getService
   * @param {String} name The name of the service
   * @return {Object}
   */
  // getService(name:"Assets"):Components.Assets;
  // getService(name:"Camera"):Components.Camera;
  // getService(name:"Fps"):Components.Fps;
  // getService(name:"GameLoop"):Components.GameLoop;
  // getService(name:"Keyboard"):Components.Keyboard;
  // getService(name:"Light"):Components.Light;
  // getService(name:"Mouse"):Components.Mouse;
  // getService(name:"Renderable"):Components.Renderable;
  // getService(name:"Renderer"):Components.Renderer;
  // getService(name:"Time"):Components.Time;
  // getService(name:"Transform"):Components.Transform;
  public getService(name: string): any {
    const result = this.services[name]

    if (result) {
      return result
    }

    throw new Error(`Service '${name}' is missing`)
  }

  public getServices(map: { [key: string]: string }, target?: any): { [key: string]: any } {
    for (const key in map) {
      if (map.hasOwnProperty(key)) {
        const lookup = map[key]
        if (lookup.indexOf('root:') === 0) {
          map[key] = this.root.getService(lookup.replace('root:', ''))
        } else {
          map[key] = this.getService(lookup)
        }
      }
    }
    if (target) {
      extend(target, map)
    }
    return map
  }

  /**
   * Adds a child node and creates a parent child relationship
   * @chainable
   * @method addChild
   * @param {Node} child The child node to add
   * @return {Node} A reference to `this`
   */
  public addChild(child: Entity): Entity {
    if (child.parent) {
      child.parent.removeChild(child)
    }
    this.children.push(child)
    child.parent = this
    child.root = this.root
    return this
  }

  /**
   * Creates and adds a new child entity and passes it to each of the given template functions.
   * @param {string|function} templates
   * @returns {Glib.Entity}
   */
  public buildChild(...config: any[]): Entity {
    const child = new Entity()
    this.addChild(child)
    child.applyTemplates(config)
    return this
  }

  /**
   * calls addChild on `parent`
   * @chainable
   * @method addTo
   * @param {Node} parent The parent node
   * @return {Node} A reference to `this`
   */
  private addTo(parent: Entity): Entity {
    parent.addChild(this)
    return this
  }

  /**
   * Removes the given node from the child collection and breaks the parent child relation ship
   * @chainable
   * @method removeChild
   * @param node The child to remove
   * @return {Node} A reference to `this`
   */
  public removeChild(node: Entity): Entity {
    const index = this.children.indexOf(node)
    if (index >= 0) {
      this.children.splice(index, 1)
      node.parent = null
    }
    return this
  }

  /**
   * Adds a component to this node. If the component has a `serviceName` property it is also registered as a service.
   * @chainable
   * @method addComponent
   * @param comp The component to add
   * @return {Node} A reference to `this`
   */
  public addComponent(comp: Component): Entity {
    if (comp.node) {
      comp.node.removeComponent(comp)
    }
    comp.node = this
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
   * @chainable
   * @method removeComponent
   * @param comp The component to remove
   * @return {Node} A reference to `this`
   */
  public removeComponent(comp: Component): Entity {
    if (comp.service && comp.name) {
      delete this.services[comp.name]
    }
    let index = this.components.indexOf(comp)
    if (index >= 0) {
      this.components.splice(index, 1)
      comp.node = null
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
   * @chainable
   * @method commitComponents
   * @example
   * node.createNode()
   *   .addComponent(new Gin.Components.Transform())
   *   .addComponent(new Gin.Components.Camera())
   *   .commitComponents() // the camera component will be bound to the transform component right here
   * @return {Node}
   */
  public commitComponents(): Entity {
    this.initializeComponents(false)
    return this
  }

  /**
   * @method _initializeComponents
   * @param {boolean} [recursive=true]
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
   * @method _updateComponents
   * @param {number} time
   * @param {boolean} [recursive=true]
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
   * @method _drawComponents
   * @param {number} time
   * @param {boolean} [recursive=true]
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
   * @method findAll
   * @param path The expression to evaluate
   * @return {*|Array} The result of the expression, which may be a Entity, Service or a Component
   */
  public findAll(path: string) {
    return this.finder.find(path, this)
  }

  /**
   * Finds the first object that matches the given expression.
   * @method find
   * @param path The expression to evaluate
   * @return {*} The result of the expression, which may be a Entity, Service or a Component
   */
  public find(path: string) {
    return this.findAll(path)[0]
  }

  /**
   * Gets all descendant of this node
   * @method descendants
   * @param [andSelf] {Boolean} if `true`, this node is also added to the resulting collection
   * @param [result] {Array} the resulting collection. If nothing is given a new array is created.
   * @return {Array} the resulting collection
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
   * @method siblings
   * @param [andSelf] {Boolean} if `true`, this node is also added to the resulting collection
   * @param [result] {Array} the resulting collection. If nothing is given a new array is created.
   * @return {Array} the resulting collection
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

  public debug(): string {
    return [
      `= Entity: ${this.name}`,
      this.components.map((component) => {
        if (component['debug']) {
          return component['debug']()
        } else {
          return `- component: ${component.name || '(unnamed)'}`
        }
      }).join('\n'),
    ].join('\n')
  }
}