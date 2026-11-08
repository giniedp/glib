import { Geometry, RenderVariant } from '@gglib/graphics'
import { describe, expect, it } from 'vitest'
import { RenderList, RenderListCache } from './RenderList'
import { RenderItemFlags, RenderListMode, RenderSortPriority } from './RenderListMode'

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

describe('RenderList', () => {
  // minimal fakes: an instanced effect, one geometry, an instance writer and an encoder that records calls
  function setup(mode: RenderListMode) {
    const program = { perInstanceTransformBlock: 'instances', applyBlock: () => true, commit: () => {} }
    const effect = { isReady: true, program, applyState: () => {}, restoreState: () => {} } as any
    const geometry = Object.assign(Object.create(Geometry.prototype), {
      indexBuffer: {},
      vertexBuffer: {},
      primitiveType: 'triangle-list',
      indexCount: 3,
      indexOffset: 0,
      baseVertex: 0,
    }) as Geometry
    let count = 0
    const instances = {
      get count() {
        return count
      },
      begin: () => {},
      apply: () => {},
      write: () => {
        count++
      },
      commit: () => {},
    } as any
    const view = { camera: { view: new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]), far: 100, near: 1 } } as any
    const list = new RenderList()
    list.begin(mode, view, {}, instances)
    const transform = new Float32Array(16) as any
    const add = (layer: number) => {
      const key = list.getKey(0, layer, 1, 0, 1)
      list.add(key, geometry, effect, null, transform, null)
    }
    const calls: string[] = []
    const pass = {
      setStencilReference: (v: number) => calls.push(`stencil ${v}`),
      setIndexBuffer: () => {},
      setVertexBuffer: () => {},
      setPrimitiveType: () => {},
      drawIndexed: (_c: number, instanceCount: number) => calls.push(`draw x${instanceCount}`),
    } as any
    return { list, add, pass, calls }
  }

  it('sets the stencil reference of each draw from the item layer and does not merge across references', () => {
    const mode = new RenderListMode(RenderSortPriority.State, RenderItemFlags.Opaque, {
      stencilReference: (layer) => (layer & 2 ? 1 : 0),
    })
    const { list, add, pass, calls } = setup(mode)
    add(2)
    add(1)
    add(2)
    list.end()
    list.render(pass)
    // sorted by layer: layer 1 first, the two layer 2 entries are one instanced draw
    expect(calls).toEqual(['stencil 0', 'draw x1', 'stencil 1', 'draw x2'])
  })

  it('leaves the stencil reference alone without a stencilReference function', () => {
    const { list, add, pass, calls } = setup(new RenderListMode(RenderSortPriority.State, RenderItemFlags.Opaque))
    add(2)
    add(1)
    list.end()
    list.render(pass)
    // without stencil references the entries of both layers merge into one instanced draw, as before
    expect(calls).toEqual(['draw x2'])
  })
})
