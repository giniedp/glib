module Glib {

  import log = Glib.utils.log

  function collectItem(item, collection) {
    if (item && collection.indexOf(item) < 0) {
      collection.push(item)
    }
  }

  function collectChildren(node, collection) {
    for (const child of node.children) {
      collectItem(child, collection)
    }
  }

  function collectChildrenAndSelf(node, collection) {
    collectItem(node, collection)
    for (const child of node.children) {
      collectItem(child, collection)
    }
  }

  function collectDescendants(node, result) {
    node.descendants(false, result)
  }

  function collectDescendantsAndSelf(node, result) {
    node.descendants(true, result)
  }

  function collectChildrenByName(node, name, result) {
    for (const child of node.children) {
      if (child.name === name) {
        result.push(child)
      }
    }
  }

  function collectParent(node, collection) {
    collectItem(node.parent, collection)
  }

  function collectServices(node, collection) {
    for (const component of node.components) {
      if (component.service) {
        collectItem(component, collection)
      }
    }
  }

  function collectServicesByName(node, name, collection) {
    collectItem(node.s[name], collection)
  }

  function collectComponents(node, collection) {
    for (const component of node.components) {
      collectItem(component, collection)
    }
  }

  function collectComponentsByName(node, name, collection) {
    for (const component of node.components) {
      if (component.name === name) {
        collectItem(component, collection)
      }
    }
  }

  function onInvalidExpression(state: EntityFinder) {
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
    named: /^[a-zA-Z0-9]+(\|[a-zA-Z0-9]+)*/
  }

  type ConsumeFunction = (state: EntityFinder) => void

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

  export class EntityFinder {
    public query: string
    public match: string
    public context: any[] = []
    public collection: any[] = []
    public start: Entity
    public parser

    public swapContext() {
      const tmp = this.context
      this.context = this.collection
      this.collection = tmp
      this.collection.length = 0
    }

    public find(query, node) {
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
    absolute: (state: EntityFinder) => {
      collectItem(state.start.root, state.context)
      state.parser = nodeConsumer
    },
    relative: (state: EntityFinder) => {
      collectItem(state.start, state.context)
      state.parser = nodeConsumer
    },
    parent: (state: EntityFinder) => {
      for (const node of state.context) {
        collectParent(node, state.collection)
      }
    },
    children: onInvalidExpression,
    descendants: onInvalidExpression,
    named: onInvalidExpression
  }

  const nodeConsumer: Consumer = {
    service: (state: EntityFinder) => {
      state.parser = serviceConsumer
    },
    component: (state: EntityFinder) => {
      state.parser = componentConsumer
    },
    absolute: (state: EntityFinder) => {
      for (const node of state.context) {
        collectItem(node, state.collection)
      }
    },
    relative: onInvalidExpression,
    parent: (state: EntityFinder) => {
      collectItem(state.start.parent, state.context)
    },
    children:  (state: EntityFinder)  => {
      for (const node of state.context) {
        collectChildren(node, state.collection)
      }
    },
    descendants:  (state: EntityFinder)  => {
      for (const node of state.context) {
        collectDescendants(node, state.collection)
      }
    },
    named: (state: EntityFinder) => {
      for (const node of state.context) {
        collectChildrenByName(node, state.match, state.collection)
      }
    }
  }

  const componentConsumer: Consumer = {
    service: onInvalidExpression,
    component: onInvalidExpression,
    absolute: onInvalidExpression,
    relative: onInvalidExpression,
    parent: onInvalidExpression,
    children: onInvalidExpression,
    descendants: onInvalidExpression,
    named: (state: EntityFinder) => {
      for (const node of state.context) {
        collectComponentsByName(node, state.match, state.collection)
      }
    }
  }

  const serviceConsumer: Consumer = {
    service: onInvalidExpression,
    component: onInvalidExpression,
    absolute: onInvalidExpression,
    relative: onInvalidExpression,
    parent: onInvalidExpression,
    children: onInvalidExpression,
    descendants: onInvalidExpression,
    named: (state: EntityFinder) => {
      for (const node of state.context) {
        collectServicesByName(node, state.match, state.collection)
      }
    }
  }
}
