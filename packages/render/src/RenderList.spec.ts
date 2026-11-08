import { RenderVariant } from '@gglib/graphics'
import { describe, expect, it } from 'vitest'
import { RenderListCache } from './RenderList'
import { RenderListMode } from './RenderListMode'

describe('RenderListCache', () => {
  it('keeps one list per mode and variant', () => {
    const cache = new RenderListCache()
    const forward = cache.get(RenderListMode.Opaque, RenderVariant.Forward)
    const depth = cache.get(RenderListMode.Opaque, RenderVariant.Depth)
    expect(forward).not.toBe(depth)
    expect(cache.get(RenderListMode.Opaque, RenderVariant.Depth)).toBe(depth)
    expect(cache.get(RenderListMode.Transparent, RenderVariant.Depth)).not.toBe(depth)
  })

  it('defaults to the forward variant', () => {
    const cache = new RenderListCache()
    expect(cache.get(RenderListMode.Opaque)).toBe(cache.get(RenderListMode.Opaque, RenderVariant.Forward))
  })

  it('resets the sorted state of every variant on clear', () => {
    const cache = new RenderListCache()
    const forward = cache.get(RenderListMode.Opaque, RenderVariant.Forward)
    const depth = cache.get(RenderListMode.Opaque, RenderVariant.Depth)
    forward.isSorted = true
    depth.isSorted = true
    cache.clear()
    expect(forward.isSorted).toBe(false)
    expect(depth.isSorted).toBe(false)
  })
})
