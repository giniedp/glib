import { referenceCounter, type ReferenceCounter } from './ReferenceCounter'

export type ResourceKey = any & { ref?: never }
export interface ReferenceCounted {
  ref: ReferenceCounter
}

export interface ResourceTracker<T extends ReferenceCounted> {
  [Symbol.iterator](): IterableIterator<T>
  /**
   * Adds a resource to the collection and removes when it is finalized.
   *
   * @remarks
   * The resource must have a reference counter.
   */
  track(resource: T): void

  /**
   * Retains a resource from the collection if it exists, otherwise creates a new one using the provided factory function.
   *
   * @param key
   * @param factory
   */
  retainOrCreate(key: ResourceKey, factory: (ref: ReferenceCounter) => T): T

  /**
   * The number of tracked resources
   */
  readonly count: number

  /**
   * The number of stale resources (ref count zero, not finalized)
   */
  readonly staleCount: number
}

export function createResourceTracker<T extends ReferenceCounted>(): ResourceTracker<T> {
  const set = new Set<T>()
  const stale = new Set<ReferenceCounter>()
  const shared = new Map<ResourceKey, T>()
  return {
    [Symbol.iterator]() {
      return set.values()
    },
    track(resource: T) {
      if (!resource.ref) {
        throw new Error('Resource must have a reference counter')
      }
      set.add(resource)
      resource.ref.onZero(() => stale.add(resource.ref))
      resource.ref.onRevive(() => stale.delete(resource.ref))
      resource.ref.onFinalize(() => {
        set.delete(resource)
        stale.delete(resource.ref)
      })
    },
    retainOrCreate(key: ResourceKey, factory: (ref: ReferenceCounter) => T): T | null {
      if (shared.has(key)) {
        const result = shared.get(key)
        result.ref.retain()
        return result
      }

      let timeout: any
      function scheduleFinalize() {
        timeout ||= setTimeout(() => {
          ref.finalize()
          timeout = null
        })
      }
      function cancelFinalize() {
        if (timeout) {
          clearTimeout(timeout)
          timeout = null
        }
      }

      const ref = referenceCounter()
      ref.onZero(() => {
        stale.add(ref)
        scheduleFinalize()
      })
      ref.onRevive(() => {
        stale.delete(ref)
        cancelFinalize()
      })
      ref.onFinalize(() => {
        set.delete(result)
        stale.delete(ref)
        shared.delete(key)
        cancelFinalize()
      })
      const result = factory(ref)
      shared.set(key, result)
      return result
    },
    get count() {
      return set.size
    },
    get staleCount() {
      return stale.size
    },
  }
}
