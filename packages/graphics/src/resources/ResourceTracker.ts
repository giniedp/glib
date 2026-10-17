import type { FrameFn } from '../FrameScheduler'
import type { Ownable } from './ResourceOwnership'

export type ResourceKey = any & { ownership?: never }

export interface ResourceTrackerOptions {
  /**
   * Number of frames a shared resource without owners is kept alive before it is finalized.
   * A resource that is acquired again within this time is revived instead of recreated.
   *
   * @remarks
   * Defaults to 60. A value of 0 finalizes the resource immediately.
   */
  keepAliveFrames?: number
  /**
   * Schedules the per frame collection of stale resources
   */
  scheduler?: { schedule(fn: FrameFn<void>): unknown }
}

export interface ResourceTracker<T extends Ownable> {
  [Symbol.iterator](): IterableIterator<T>
  /**
   * Tracks an exclusive resource. The resource is finalized as soon as it has no owners.
   */
  track<R extends T>(resource: R): R

  /**
   * Tracks a shared resource under the given key.
   * The resource is kept alive for {@link ResourceTrackerOptions.keepAliveFrames} after it has no owners.
   */
  share<R extends T>(key: ResourceKey, resource: R): R

  /**
   * Gets a shared resource by key, including stale resources.
   */
  get(key: ResourceKey): T | null

  /**
   * Advances the keep alive counter of stale resources by one frame and finalizes the expired ones
   */
  collect(): void

  /**
   * Finalizes all tracked resources
   */
  finalizeAll(): void

  /**
   * The number of tracked resources
   */
  readonly count: number

  /**
   * The number of stale resources (no owners, not finalized)
   */
  readonly staleCount: number
}

export function createResourceTracker<T extends Ownable>(options?: ResourceTrackerOptions): ResourceTracker<T> {
  const keepAliveFrames = options?.keepAliveFrames ?? 60
  const scheduler = options?.scheduler
  const set = new Set<T>()
  const stale = new Map<T, number>()
  const shared = new Map<ResourceKey, T>()
  let isScheduled = false

  function add(resource: T) {
    if (!resource.ownership) {
      throw new Error('Resource must have an owner set')
    }
    set.add(resource)
    resource.ownership.onFinalize(() => {
      set.delete(resource)
      stale.delete(resource)
    })
  }

  function collect() {
    // removing the current entry and updating a value are both safe while iterating
    for (const [resource, frames] of stale) {
      if (resource.ownership.isOwned) {
        // acquired again
        stale.delete(resource)
      } else if (frames <= 1) {
        resource.ownership.finalize()
      } else {
        stale.set(resource, frames - 1)
      }
    }
  }

  function scheduleCollect() {
    if (isScheduled || !scheduler) {
      return
    }
    isScheduled = true
    scheduler.schedule((ctx) => {
      collect()
      if (stale.size === 0) {
        isScheduled = false
        ctx.complete()
      }
    })
  }

  return {
    [Symbol.iterator]() {
      return set.values()
    },
    track<R extends T>(resource: R) {
      add(resource)
      return resource
    },
    share<R extends T>(key: ResourceKey, resource: R) {
      if (shared.has(key)) {
        throw new Error(`Resource already exists for key: ${getKeyName(key)}`)
      }
      add(resource)
      shared.set(key, resource)
      resource.ownership.onFinalize(() => shared.delete(key))
      resource.ownership.setReleaseHandler(() => {
        if (keepAliveFrames <= 0) {
          resource.ownership.finalize()
        } else {
          stale.set(resource, keepAliveFrames)
          scheduleCollect()
        }
      })
      return resource
    },
    get(key: ResourceKey): T | null {
      return shared.get(key) || null
    },
    collect,
    finalizeAll() {
      for (const resource of Array.from(set)) {
        resource.ownership.finalize()
      }
    },
    get count() {
      return set.size
    },
    get staleCount() {
      let count = 0
      for (const resource of stale.keys()) {
        if (!resource.ownership.isOwned) {
          count++
        }
      }
      return count
    },
  }
}

export function getKeyName(key: any): string {
  if (typeof key === 'function') {
    return key.name || '(anonymous)'
  } else if (typeof key === 'string') {
    return key
  } else {
    return String(key)
  }
}
