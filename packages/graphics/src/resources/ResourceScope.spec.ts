import { describe, expect, it, vi } from 'vitest'
import { type Ownable, ResourceOwnership } from './ResourceOwnership'
import { ResourceScope } from './ResourceScope'

describe('ResourceScope', () => {
  interface DummyResource extends Ownable {
    name: string
    onFinalize: ReturnType<typeof vi.fn<() => void>>
  }

  function makeResource(name: string, children: DummyResource[] = []): DummyResource {
    const resource = { name, onFinalize: vi.fn<() => void>() } as unknown as DummyResource & {
      ownership: ResourceOwnership
    }
    resource.ownership = new ResourceOwnership(resource)
    resource.ownership.onFinalize(resource.onFinalize)
    for (const child of children) {
      resource.ownership.adopt(child)
    }
    return resource
  }

  it('owns and releases resources', () => {
    const a = new ResourceScope('a')
    const r = makeResource('r')
    expect(a.adopt(r)).toBe(r)
    expect(a.has(r)).toBe(true)
    expect(a.resourceCount).toBe(1)
    expect(r.ownership.isClaimed).toBe(true)
    a.drop(r)
    expect(a.has(r)).toBe(false)
    expect(r.onFinalize).toHaveBeenCalledTimes(1)
  })

  it('owns idempotently', () => {
    const a = new ResourceScope('a')
    const r = makeResource('r')
    a.adopt(r)
    a.adopt(r)
    expect(a.resourceCount).toBe(1)
    a.drop(r)
    expect(r.onFinalize).toHaveBeenCalledTimes(1)
  })

  it('ignores release of unknown resources', () => {
    const a = new ResourceScope('a')
    const r = makeResource('r')
    a.drop(r)
    expect(r.onFinalize).not.toHaveBeenCalled()
  })

  describe('ownUntilClaimed', () => {
    it('holds a resource until another scope claims it', () => {
      const global = new ResourceScope('global')
      const a = global.createChild('a')
      const r = global.adoptUntilClaimed(makeResource('r'))
      expect(global.has(r)).toBe(true)
      expect(r.ownership.isClaimed).toBe(false)
      a.adopt(r)
      expect(global.has(r)).toBe(false)
      expect(global.resourceCount).toBe(0)
      a.dispose()
      expect(r.onFinalize).toHaveBeenCalledTimes(1)
    })

    it('finalizes the resource with the scope if nobody claimed it', () => {
      const global = new ResourceScope('global')
      const r = global.adoptUntilClaimed(makeResource('r'))
      global.dispose()
      expect(r.onFinalize).toHaveBeenCalledTimes(1)
    })

    it('keeps the resource when the same scope claims it', () => {
      const global = new ResourceScope('global')
      const a = global.createChild('a')
      const r = global.adoptUntilClaimed(makeResource('r'))
      global.adopt(r)
      a.adopt(r)
      a.dispose()
      expect(r.onFinalize).not.toHaveBeenCalled()
      expect(global.has(r)).toBe(true)
      global.dispose()
      expect(r.onFinalize).toHaveBeenCalledTimes(1)
    })
  })

  it('shares a resource between scopes', () => {
    const a = new ResourceScope('a')
    const b = new ResourceScope('b')
    const r = makeResource('r')
    a.adopt(r)
    b.adopt(r)
    a.dispose()
    expect(r.onFinalize).not.toHaveBeenCalled()
    b.dispose()
    expect(r.onFinalize).toHaveBeenCalledTimes(1)
  })

  it('releases children through their parents', () => {
    const a = new ResourceScope('a')
    const texture = makeResource('texture')
    const material = makeResource('material', [texture])
    const mesh = makeResource('mesh', [material])
    a.adopt(mesh)
    expect(a.resourceCount).toBe(1)
    expect(a.walk()).toEqual([mesh, material, texture])
    a.drop(mesh)
    expect(a.resourceCount).toBe(0)
    expect(mesh.onFinalize).toHaveBeenCalledTimes(1)
    expect(material.onFinalize).toHaveBeenCalledTimes(1)
    expect(texture.onFinalize).toHaveBeenCalledTimes(1)
  })

  it('walks shared children once into a reused array', () => {
    const a = new ResourceScope('a')
    const texture = makeResource('texture')
    const material1 = makeResource('material1', [texture])
    const material2 = makeResource('material2', [texture])
    a.adopt(material1)
    a.adopt(material2)
    const out: Ownable[] = [makeResource('stale')]
    expect(a.walk(out)).toBe(out)
    expect(out).toEqual([material1, texture, material2])
  })

  it('keeps a child that is owned directly', () => {
    const a = new ResourceScope('a')
    const texture = makeResource('texture')
    const material = makeResource('material', [texture])
    a.adopt(texture)
    a.adopt(material)
    a.drop(material)
    expect(material.onFinalize).toHaveBeenCalledTimes(1)
    expect(texture.onFinalize).not.toHaveBeenCalled()
    expect(a.has(texture)).toBe(true)
  })

  it('keeps a child that is shared with another scope', () => {
    const a = new ResourceScope('a')
    const b = new ResourceScope('b')
    const texture = makeResource('texture')
    const material1 = makeResource('material1', [texture])
    const material2 = makeResource('material2', [texture])
    a.adopt(material1)
    b.adopt(material2)
    a.dispose()
    expect(material1.onFinalize).toHaveBeenCalledTimes(1)
    expect(texture.onFinalize).not.toHaveBeenCalled()
    b.dispose()
    expect(texture.onFinalize).toHaveBeenCalledTimes(1)
  })

  it('forgets finalized resources', () => {
    const a = new ResourceScope('a')
    const b = new ResourceScope('b')
    const r = makeResource('r')
    a.adopt(r)
    b.adopt(r)
    r.ownership.finalize()
    expect(a.has(r)).toBe(false)
    expect(b.has(r)).toBe(false)
    a.dispose()
    expect(r.onFinalize).toHaveBeenCalledTimes(1)
  })

  it('throws when owning a finalized resource', () => {
    const a = new ResourceScope('a')
    const r = makeResource('r')
    r.ownership.finalize()
    expect(() => a.adopt(r)).toThrow()
    expect(a.has(r)).toBe(false)
  })

  it('disposes child scopes first', () => {
    const global = new ResourceScope('global')
    const a = global.createChild('a')
    const order: string[] = []
    const r1 = makeResource('r1')
    const r2 = makeResource('r2')
    r1.ownership.onFinalize(() => order.push('global'))
    r2.ownership.onFinalize(() => order.push('a'))
    global.adopt(r1)
    a.adopt(r2)
    global.dispose()
    expect(order).toEqual(['a', 'global'])
    expect(a.isDisposed).toBe(true)
  })

  it('registers child scopes', () => {
    const global = new ResourceScope('global')
    const a = global.createChild('a')
    expect(a.parent).toBe(global)
    expect(Array.from(global.children)).toEqual([a])
    a.dispose()
    expect(Array.from(global.children)).toEqual([])
  })

  it('throws after dispose', () => {
    const a = new ResourceScope('a')
    a.dispose()
    a.dispose()
    expect(() => a.adopt(makeResource('r'))).toThrow()
    expect(() => a.adoptUntilClaimed(makeResource('r'))).toThrow()
    expect(() => a.createChild()).toThrow()
  })

  it('supports using declarations', () => {
    const r = makeResource('r')
    {
      using a = new ResourceScope('a')
      a.adopt(r)
    }
    expect(r.onFinalize).toHaveBeenCalledTimes(1)
  })
})
