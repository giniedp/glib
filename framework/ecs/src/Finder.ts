import { Component } from './Component'
import { Entity } from './Entity'

function collectItem<T>(item: T, collection: T[]) {
  if (item && collection.indexOf(item) < 0) {
    collection.push(item)
  }
}

function collectChildren(node: Entity, collection: Entity[]) {
  for (const child of node.children) {
    collectItem(child, collection)
  }
}

function collectChildrenAndSelf(node: Entity, collection: Entity[]) {
  collectItem(node, collection)
  for (const child of node.children) {
    collectItem(child, collection)
  }
}

function collectDescendants(node: Entity, result: Entity[]) {
  node.descendants(false, result)
}

function collectDescendantsAndSelf(node: Entity, result: Entity[]) {
  node.descendants(true, result)
}

function collectChildrenByName(node: Entity, name: string, result: Entity[]) {
  for (const child of node.children) {
    if (child.name === name) {
      result.push(child)
    }
  }
}

function collectParent(node: Entity, collection: Entity[]) {
  collectItem(node.parent, collection)
}

function collectServices(node: Entity, collection: Component[]) {
  for (const component of node.components) {
    if (component.service) {
      collectItem(component, collection)
    }
  }
}

function collectServicesByName(node: Entity, name: string, collection: Component[]) {
  collectItem(node.s[name], collection)
}

function collectComponents(node: Entity, collection: Component[]) {
  for (const component of node.components) {
    collectItem(component, collection)
  }
}

function collectComponentsByName(node: Entity, name: string, collection: Component[]) {
  for (const component of node.components) {
    if (component.name === name) {
      collectItem(component, collection)
    }
  }
}

function onInvalidExpression(state: Finder) {
  throw new Error('Invalid expression')
}

const expressions = {
  service: /^::/,
  component: /^:/,

  absolute: /^\//,
  relative: /^\.\/|(self::)/,
  parent: /^\.\.\//,
  children: /^\*|(child::\*)|(child::)/,
  descendants: /^\/\//,
  named: /^[a-zA-Z0-9]+(\|[a-zA-Z0-9]+)*/,
}

type ConsumeFunction = (state: Finder) => void

interface Consumer {
  service: ConsumeFunction
  component: ConsumeFunction

  absolute: ConsumeFunction
  relative: ConsumeFunction
  parent: ConsumeFunction
  children: ConsumeFunction
  descendants: ConsumeFunction
  named: ConsumeFunction
}

export class Finder {
  public query: string
  public match: string
  public context: any[] = []
  public collection: any[] = []
  public start: Entity
  public parser: any

  public swapContext() {
    const tmp = this.context
    this.context = this.collection
    this.collection = tmp
    this.collection.length = 0
  }

  public find(query: string, node: Entity) {
    this.query = query
    this.match = null
    this.context = []
    this.collection = []
    this.start = node
    this.parser = startConsumer
    const reg = expressions

    const order = ['absolute', 'relative', 'parent', 'children', 'descendants', 'named', 'service', 'component']
    while (query) {
      let consumed = false
      for (const directive of order) {
        const exp = reg[directive]
        const match = query.match(exp)
        if (match) {
          query = query.replace(exp, '')
          this.match = match[0]
          this.parser[directive](this)
          consumed = true
        }
      }
      this.swapContext()
      if (!consumed) {
        onInvalidExpression(this)
        return this.context
      }
    }
    return this.context
  }
}

const startConsumer: Consumer = {
  service: onInvalidExpression,
  component: onInvalidExpression,
  absolute: (state: Finder) => {
    collectItem(state.start.root, state.context)
    state.parser = nodeConsumer
  },
  relative: (state: Finder) => {
    collectItem(state.start, state.context)
    state.parser = nodeConsumer
  },
  parent: (state: Finder) => {
    for (const node of state.context) {
      collectParent(node, state.collection)
    }
  },
  children: onInvalidExpression,
  descendants: onInvalidExpression,
  named: onInvalidExpression,
}

const nodeConsumer: Consumer = {
  service: (state: Finder) => {
    state.parser = serviceConsumer
  },
  component: (state: Finder) => {
    state.parser = componentConsumer
  },
  absolute: (state: Finder) => {
    for (const node of state.context) {
      collectItem(node, state.collection)
    }
  },
  relative: onInvalidExpression,
  parent: (state: Finder) => {
    collectItem(state.start.parent, state.context)
  },
  children:  (state: Finder)  => {
    for (const node of state.context) {
      collectChildren(node, state.collection)
    }
  },
  descendants:  (state: Finder)  => {
    for (const node of state.context) {
      collectDescendants(node, state.collection)
    }
  },
  named: (state: Finder) => {
    for (const node of state.context) {
      collectChildrenByName(node, state.match, state.collection)
    }
  },
}

const componentConsumer: Consumer = {
  service: onInvalidExpression,
  component: onInvalidExpression,
  absolute: onInvalidExpression,
  relative: onInvalidExpression,
  parent: onInvalidExpression,
  children: onInvalidExpression,
  descendants: onInvalidExpression,
  named: (state: Finder) => {
    for (const node of state.context) {
      collectComponentsByName(node, state.match, state.collection)
    }
  },
}

const serviceConsumer: Consumer = {
  service: onInvalidExpression,
  component: onInvalidExpression,
  absolute: onInvalidExpression,
  relative: onInvalidExpression,
  parent: onInvalidExpression,
  children: onInvalidExpression,
  descendants: onInvalidExpression,
  named: (state: Finder) => {
    for (const node of state.context) {
      collectServicesByName(node, state.match, state.collection)
    }
  },
}
