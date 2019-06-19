import { Type } from '@gglib/core'
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

function collectParent<T>(node: Entity, collection: Entity[]) {
  collectItem(node.parent, collection)
}

function collectServicesByName(node: Entity, name: string, collection: Component[]) {
  collectItem(node.services[name], collection)
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

function collectComponentsByType(node: Entity, type: Type<Component>, collection: Component[]) {
  for (const component of node.components) {
    if (component instanceof type) {
      collectItem(component, collection)
    }
  }
}

function onInvalidExpression(finder: FinderState) {
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

type ExpressionParseFunction = (state: FinderState) => void

interface ExpressionParser {
  service: ExpressionParseFunction
  component: ExpressionParseFunction

  absolute: ExpressionParseFunction
  relative: ExpressionParseFunction
  parent: ExpressionParseFunction
  children: ExpressionParseFunction
  descendants: ExpressionParseFunction
  named: ExpressionParseFunction
}

const startParser: ExpressionParser = {
  service: onInvalidExpression,
  component: onInvalidExpression,
  absolute: (state: FinderState) => {
    collectItem(state.start.root, state.context)
    state.parser = nodeParser
  },
  relative: (state: FinderState) => {
    collectItem(state.start, state.context)
    state.parser = nodeParser
  },
  parent: (state: FinderState) => {
    for (const node of state.context) {
      collectParent(node as Entity, state.collection as Entity[])
    }
  },
  children: onInvalidExpression,
  descendants: onInvalidExpression,
  named: onInvalidExpression,
}

const nodeParser: ExpressionParser = {
  service: (state: FinderState) => {
    state.parser = serviceParser
  },
  component: (state: FinderState) => {
    state.parser = componentParser
  },
  absolute: (state: FinderState) => {
    for (const node of state.context) {
      collectItem(node, state.collection)
    }
  },
  relative: onInvalidExpression,
  parent: (state: FinderState) => {
    collectItem(state.start.parent, state.context)
  },
  children:  (state: FinderState)  => {
    for (const node of state.context) {
      collectChildren(node as Entity, state.collection as Entity[])
    }
  },
  descendants:  (state: FinderState)  => {
    for (const node of state.context) {
      collectDescendants(node as Entity, state.collection as Entity[])
    }
  },
  named: (state: FinderState) => {
    for (const node of state.context) {
      collectChildrenByName(node as Entity, state.match, state.collection as Entity[])
    }
  },
}

const componentParser: ExpressionParser = {
  service: onInvalidExpression,
  component: onInvalidExpression,
  absolute: onInvalidExpression,
  relative: onInvalidExpression,
  parent: onInvalidExpression,
  children: onInvalidExpression,
  descendants: onInvalidExpression,
  named: (state: FinderState) => {
    for (const node of state.context) {
      collectComponentsByName(node as Entity, state.match, state.collection)
    }
  },
}

const serviceParser: ExpressionParser = {
  service: onInvalidExpression,
  component: onInvalidExpression,
  absolute: onInvalidExpression,
  relative: onInvalidExpression,
  parent: onInvalidExpression,
  children: onInvalidExpression,
  descendants: onInvalidExpression,
  named: (state: FinderState) => {
    for (const node of state.context) {
      collectServicesByName(node as Entity, state.match, state.collection)
    }
  },
}

interface FinderState {
  query: string
  match: string
  context: Array<Component|Entity>
  collection: Array<Component|Entity>
  start: Entity
  parser: ExpressionParser
}

const finderState: FinderState = {
  query: null,
  match: null,
  context: [],
  collection: [],
  start: null,
  parser: startParser,
}

const parseOrder: Array<keyof typeof expressions> = [
  'absolute',
  'relative',
  'parent',
  'children',
  'descendants',
  'named',
  'service',
  'component',
]

function resetState(state: FinderState, query: string, node: Entity) {
  state.query = query
  state.match = null
  state.context = []
  state.collection = []
  state.start = node
  state.parser = startParser
}

function swapContext(state: FinderState) {
  const tmp = state.context
  state.context = state.collection
  state.collection = tmp
  state.collection.length = 0
}

export function findAll(query: string, node: Entity): Array<Component|Entity> {
  const state = finderState
  resetState(state, query, node)
  while (query) {
    let consumed = false
    for (const directive of parseOrder) {
      const exp = expressions[directive]
      const match = query.match(exp)
      if (match) {
        query = query.replace(exp, '')
        state.match = match[0]
        state.parser[directive](state)
        consumed = true
      }
    }
    swapContext(state)
    if (!consumed) {
      onInvalidExpression(state)
      return state.context
    }
  }
  return state.context
}

export function find(query: string, node: Entity): Component|Entity {
  return findAll(query, node)[0]
}
