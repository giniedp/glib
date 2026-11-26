import { LoadContext } from './ContentLoader'

export type ResourceKey = string

export type ResourceRef<T> = ResourceKey & { __type__: T }

export type ResourceGetter = <R>(key: ResourceRef<R>) => R

export type NotPromise<T> = T extends Promise<any> ? never : T
export type ResourceBuilder<T> = (context: LoadContext, node: ResourceNode<T>, get: ResourceGetter) => NotPromise<T>
export type ResourceAsyncBuilder<T> = (context: LoadContext, node: ResourceNode<T>, get: ResourceGetter) => Promise<T>

export type ResourceNode<T extends NotPromise<any> = {}> = {
  key: ResourceKey
  data: T
  deps: ResourceDependency<T, any>[]
  build?: ResourceBuilder<T>
  buildAsync?: ResourceAsyncBuilder<T>
}

export type ResourceDependency<V = unknown, R = unknown> = {
  ref: ResourceRef<R>
  assign?: (target: V, dependency: R) => void
}

export class ResourceGraph {
  protected readonly graph = new Map<ResourceKey, ResourceNode<any>>()
  protected readonly results: Map<ResourceKey, any> = new Map()
  protected readonly inflight: Map<ResourceKey, Promise<any>> = new Map()

  /**
   * Checks if a resource node with the given key exists in the graph
   */
  public has(key: ResourceKey): boolean {
    return this.graph.has(key)
  }

  /**
   * Gets the resource node associated with the given key, or undefined if it does not exist in the graph
   */
  public get<T = unknown>(key: ResourceKey): ResourceNode<T> | undefined {
    return this.graph.get(key)
  }

  /**
   * Adds a resource node with the given key and optional data to the graph.
   * The key must be unique within the graph, otherwise an error will be thrown.
   */
  public node<T>(key: ResourceKey, data?: T): ResourceNode<T> {
    if (this.graph.has(key)) {
      throw new Error(`Resource node with key ${key} already exists in the graph`)
    }
    const node: ResourceNode<T> = {
      key,
      data: data!,
      deps: [],
    }
    this.graph.set(node.key, node)
    return node
  }

  /**
   * Adds a dependency from the given node to the given dependency node, with an optional assignment
   * function that will be called with the resolved value of the dependency once it is available.
   *
   * @returns the key of the dependency node for convenience.
   */
  public assign<T, R>(
    node: ResourceNode<T>,
    dep: ResourceNode<R>,
    assign: (target: T, dependency: R) => void,
  ): ResourceRef<R> {
    const ref = dep.key as ResourceRef<R>
    node.deps.push({
      ref,
      assign,
    })
    return ref
  }

  /**
   * Adds a dependency from the given node to the given dependency node without an assignment function.
   * This is useful when the target node will access the dependency's resolved value through the getResult
   * function in its resolve method, rather than having it assigned directly.
   */
  public dependency<T, R>(node: ResourceNode<T>, dep: ResourceNode<R>): ResourceRef<R> {
    return this.assign(node, dep, null)
  }

  public getOrderedSubsetForNode<T>(node: ResourceNode<T>): ResourceNode[] {
    const subset = collectSubset(this.graph, node)
    return toSortedSubset(this.graph, subset)
  }

  public async load<T>(target: ResourceNode<T>, context: LoadContext): Promise<T> {
    if (target == null) {
      throw new Error('Target node is null or undefined')
    }

    if (!this.graph.has(target.key)) {
      throw new Error(`Target node with key ${target.key} does not exist in the graph`)
    }

    const graph = this.graph
    const results = this.results
    const inflight = this.inflight

    // validates the subset: throws on cycles and on dependencies that are not in the graph
    for (const node of this.getOrderedSubsetForNode(target)) {
      for (const dep of node.deps) {
        if (!graph.has(dep.ref)) {
          throw new Error(`Node ${node.key} depends on missing ${dep.ref}`)
        }
      }
    }

    const getResult = <R>(key: ResourceRef<R>): R => {
      if (results.has(key)) {
        return results.get(key)
      }
      throw new Error(`Dependency ${key} has not been resolved yet`)
    }

    const finalize = (node: ResourceNode, value: unknown) => {
      for (const dep of node.deps) {
        if (dep.assign) {
          dep.assign(value, results.get(dep.ref))
        }
      }
      results.set(node.key, value)
    }

    const buildNode = async (node: ResourceNode<any>): Promise<void> => {
      // independent dependencies build concurrently
      await Promise.all(node.deps.map((dep) => resolveNode(graph.get(dep.ref)!)))
      context.signal?.throwIfAborted()

      if (!node.build && !node.buildAsync) {
        finalize(node, node.data)
        return
      }
      if (node.build) {
        const result = node.build(context, node, getResult)
        if (isThenable(result)) {
          throw new Error(`build function for node ${node.key} returned a Promise, but should return synchronously`)
        }
        finalize(node, result)
        return
      }
      // not run through `context.content.executor`: the builders load through it themselves (leaf i/o), a node
      // holding a slot while its fetch waits for one would deadlock
      finalize(node, await node.buildAsync(context, node, getResult))
    }

    // each node builds once, also across concurrent loads of the same graph
    const resolveNode = (node: ResourceNode<any>): Promise<void> => {
      if (results.has(node.key)) {
        return Promise.resolve()
      }
      let promise = inflight.get(node.key)
      if (!promise) {
        promise = buildNode(node)
        inflight.set(node.key, promise)
        const done = () => {
          inflight.delete(node.key)
        }
        promise.then(done, done)
      }
      return promise
    }

    await resolveNode(target)
    return results.get(target.key)
  }
}

function collectSubset(graph: Map<ResourceKey, ResourceNode<any>>, node: ResourceNode<any>): Set<ResourceKey> {
  const result = new Set<ResourceKey>()

  const visit = (key: ResourceKey) => {
    if (result.has(key)) return
    const node = graph.get(key)
    if (!node) {
      throw new Error(`Missing node: ${key}`)
    }
    result.add(key)
    for (const dep of node.deps) {
      visit(dep.ref)
    }
  }

  visit(node.key)

  return result
}

function toSortedSubset(graph: Map<ResourceKey, ResourceNode<any>>, subset: Set<ResourceKey>): ResourceNode[] {
  const inDegree = new Map<ResourceKey, number>()
  for (const key of subset) {
    inDegree.set(key, 0)
  }
  for (const key of subset) {
    const node = graph.get(key)!
    for (const dep of node.deps) {
      if (subset.has(dep.ref)) {
        inDegree.set(key, inDegree.get(key)! + 1)
      }
    }
  }

  const queue: ResourceNode[] = []
  for (const key of subset) {
    if (inDegree.get(key) === 0) {
      queue.push(graph.get(key)!)
    }
  }

  const order: ResourceNode[] = []
  while (queue.length) {
    const n = queue.shift()!
    order.push(n)

    for (const key of subset) {
      const m = graph.get(key)!
      for (const dep of m.deps) {
        if (dep.ref === n.key) {
          const d = inDegree.get(key)! - 1
          inDegree.set(key, d)
          if (d === 0) {
            queue.push(m)
          }
        }
      }
    }
  }

  if (order.length !== subset.size) {
    throw new Error('Cycle detected in resource graph')
  }

  return order
}

function isThenable(x: any): x is Promise<any> {
  return x && typeof x.then === 'function'
}
