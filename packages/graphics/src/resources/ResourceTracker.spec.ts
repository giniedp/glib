import { describe, expect, it } from 'vitest'
import { referenceCounter } from './ReferenceCounter'
import { createResourceTracker } from './ResourceTracker'

describe('ResourceTracker', () => {
  interface DummyResource {
    ref: ReturnType<typeof referenceCounter>
    id: number
  }

  function makeResource(id: number): DummyResource {
    return { ref: referenceCounter(), id }
  }

  it('counts active resources', () => {
    const tracker = createResourceTracker<DummyResource>()
    const res1 = makeResource(1)
    const res2 = makeResource(2)
    res1.ref.retain()
    res2.ref.retain()
    tracker.track(res1)
    tracker.track(res2)
    expect(tracker.count).toBe(2)

    res1.ref.release()
    res1.ref.finalize()
    expect(tracker.count).toBe(1)

    res2.ref.release()
    res2.ref.finalize()
    expect(tracker.count).toBe(0)
  })

  it('counts stale resources', () => {
    const tracker = createResourceTracker<DummyResource>()
    const res = makeResource(1)
    tracker.track(res)
    res.ref.retain()
    expect(tracker.staleCount).toBe(0)
    res.ref.release()
    expect(tracker.staleCount).toBe(1)
    res.ref.retain()
    expect(tracker.staleCount).toBe(0)
    res.ref.release()
    expect(tracker.staleCount).toBe(1)
    res.ref.finalize()
    expect(tracker.staleCount).toBe(0)
  })
})
