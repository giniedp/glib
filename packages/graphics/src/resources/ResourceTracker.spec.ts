import { describe, expect, it } from 'vitest'
import type { FrameFn } from '../FrameScheduler'
import { type Ownable, ResourceOwnership } from './ResourceOwnership'
import { ResourceScope } from './ResourceScope'
import { createResourceTracker } from './ResourceTracker'

describe('ResourceTracker', () => {
  interface DummyResource extends Ownable {
    id: number
  }

  function makeResource(id: number): DummyResource {
    const resource = { id } as DummyResource & { ownership: ResourceOwnership }
    resource.ownership = new ResourceOwnership(resource)
    return resource
  }

  function fakeScheduler() {
    const tasks = new Set<FrameFn<void>>()
    return {
      tasks,
      schedule(fn: FrameFn<void>) {
        tasks.add(fn)
      },
      tick() {
        for (const fn of Array.from(tasks)) {
          fn({
            frame: 0,
            time: 0,
            delta: 0,
            complete: () => tasks.delete(fn),
            cancel: () => tasks.delete(fn),
          } as any)
        }
      },
    }
  }

  it('finalizes exclusive resources without owners', () => {
    const tracker = createResourceTracker<DummyResource>()
    const scope = new ResourceScope('a')
    const res1 = scope.own(tracker.track(makeResource(1)))
    const res2 = scope.own(tracker.track(makeResource(2)))
    expect(tracker.count).toBe(2)

    scope.release(res1)
    expect(res1.ownership.isFinalized).toBe(true)
    expect(tracker.count).toBe(1)

    res2.ownership.finalize()
    expect(tracker.count).toBe(0)
    expect(tracker.staleCount).toBe(0)
  })

  it('looks up shared resources by key', () => {
    const tracker = createResourceTracker<DummyResource>()
    const res = tracker.share('key', makeResource(1))
    expect(tracker.get('key')).toBe(res)
    expect(tracker.get('other')).toBe(null)
    expect(() => tracker.share('key', makeResource(2))).toThrow()
  })

  it('keeps shared resources alive for a number of frames', () => {
    const scheduler = fakeScheduler()
    const tracker = createResourceTracker<DummyResource>({ keepAliveFrames: 2, scheduler })
    const scope = new ResourceScope('a')
    const res = scope.own(tracker.share('key', makeResource(1)))

    scope.dispose()
    expect(tracker.staleCount).toBe(1)
    expect(tracker.get('key')).toBe(res)
    expect(scheduler.tasks.size).toBe(1)

    scheduler.tick()
    expect(res.ownership.isFinalized).toBe(false)
    scheduler.tick()
    expect(res.ownership.isFinalized).toBe(true)
    expect(tracker.staleCount).toBe(0)
    expect(tracker.count).toBe(0)
    expect(tracker.get('key')).toBe(null)
    expect(scheduler.tasks.size).toBe(0)
  })

  it('revives stale shared resources', () => {
    const scheduler = fakeScheduler()
    const tracker = createResourceTracker<DummyResource>({ keepAliveFrames: 2, scheduler })
    const a = new ResourceScope('a')
    const b = new ResourceScope('b')
    const res = a.own(tracker.share('key', makeResource(1)))

    a.dispose()
    expect(tracker.staleCount).toBe(1)
    b.own(tracker.get('key'))
    expect(tracker.staleCount).toBe(0)

    scheduler.tick()
    scheduler.tick()
    expect(res.ownership.isFinalized).toBe(false)
    expect(scheduler.tasks.size).toBe(0)
  })

  it('finalizes shared resources immediately without keep alive', () => {
    const tracker = createResourceTracker<DummyResource>({ keepAliveFrames: 0 })
    const scope = new ResourceScope('a')
    const res = scope.own(tracker.share('key', makeResource(1)))
    scope.dispose()
    expect(res.ownership.isFinalized).toBe(true)
    expect(tracker.get('key')).toBe(null)
  })

  it('finalizes all resources', () => {
    const tracker = createResourceTracker<DummyResource>()
    const res1 = tracker.track(makeResource(1))
    const res2 = tracker.share('key', makeResource(2))
    tracker.finalizeAll()
    expect(res1.ownership.isFinalized).toBe(true)
    expect(res2.ownership.isFinalized).toBe(true)
    expect(tracker.count).toBe(0)
  })
})
