import { describe, expect, it } from 'vitest'
import { RenderItemFlags, RenderListMode, RenderSortPriority } from './RenderListMode'

describe('RenderListMode', () => {
  it('accepts items by flags and all layers by default', () => {
    const mode = RenderListMode.Transparent
    expect(mode.accepts(RenderItemFlags.Transparent, 1 << 4)).toBe(true)
    expect(mode.accepts(RenderItemFlags.Opaque, 1 << 4)).toBe(false)
  })

  it('splits items into disjoint lists by layer', () => {
    const water = 1 << 12
    const first = new RenderListMode(RenderSortPriority.Depth, RenderItemFlags.Transparent, { includeLayers: water })
    const rest = new RenderListMode(RenderSortPriority.Depth, RenderItemFlags.Transparent, { excludeLayers: water })
    for (const layer of [1, 1 << 2, water, water | 1]) {
      const inFirst = first.accepts(RenderItemFlags.Transparent, layer)
      const inRest = rest.accepts(RenderItemFlags.Transparent, layer)
      expect(inFirst).not.toBe(inRest)
      expect(inFirst).toBe(!!(layer & water))
    }
  })
})
