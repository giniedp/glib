import { describe, expect, it, vi } from 'vitest'
import { type Ownable, ResourceOwnership } from './ResourceOwnership'
import { ResourceScope } from './ResourceScope'

describe('ResourceScope', () => {
  interface DummyResource extends Ownable {
    name: string
    children: DummyResource[]
    onEmpty: ReturnType<typeof vi.fn<() => void>>
  }

  function makeResource(name: string, options?: { scope?: ResourceScope; children?: DummyResource[] }): DummyResource {
    const resource = {
      name,
      children: options?.children || [],
      onEmpty: vi.fn<() => void>(),
    } as unknown as DummyResource & { ownership: ResourceOwnership }
    resource.ownership = new ResourceOwnership(resource, options?.scope)
    resource.ownership.onEmpty(resource.onEmpty)
    for (const child of resource.children) {
      resource.ownership.adopt(child)
    }
    options?.scope?.adopt(resource)
    return resource
  }

  it('adopts resources as default owner', () => {
    const global = new ResourceScope('global')
    const r = makeResource('r', { scope: global })
    expect(global.has(r)).toBe(true)
    expect(r.ownership.isExplicit(global)).toBe(false)
    global.dispose()
    expect(r.onEmpty).toHaveBeenCalledTimes(1)
  })

  it('refuses to adopt when not the default owner', () => {
    const global = new ResourceScope('global')
    const a = new ResourceScope('a')
    const r = makeResource('r', { scope: global })
    expect(() => a.adopt(r)).toThrow()
  })

  it('moves ownership on first own', () => {
    const global = new ResourceScope('global')
    const a = global.createScope('a')
    const r = makeResource('r', { scope: global })
    expect(a.own(r)).toBe(r)
    expect(global.has(r)).toBe(false)
    expect(global.count).toBe(0)
    a.dispose()
    expect(r.onEmpty).toHaveBeenCalledTimes(1)
  })

  it('keeps resource owned explicitly by global scope', () => {
    const global = new ResourceScope('global')
    const a = global.createScope('a')
    const r = makeResource('r', { scope: global })
    global.own(r)
    a.own(r)
    expect(r.ownership.size).toBe(2)
    a.dispose()
    expect(r.onEmpty).not.toHaveBeenCalled()
    expect(global.has(r)).toBe(true)
    global.dispose()
    expect(r.onEmpty).toHaveBeenCalledTimes(1)
  })

  it('shares a resource between scopes', () => {
    const global = new ResourceScope('global')
    const a = global.createScope('a')
    const b = global.createScope('b')
    const r = makeResource('r', { scope: global })
    a.own(r)
    b.own(r)
    expect(r.ownership.size).toBe(2)
    a.dispose()
    expect(r.onEmpty).not.toHaveBeenCalled()
    b.dispose()
    expect(r.onEmpty).toHaveBeenCalledTimes(1)
  })

  it('owns idempotently from the owners perspective', () => {
    const a = new ResourceScope('a')
    const r = makeResource('r')
    a.own(r)
    a.own(r)
    expect(r.ownership.size).toBe(1)
    a.release(r)
    expect(r.onEmpty).not.toHaveBeenCalled()
    a.release(r)
    expect(r.onEmpty).toHaveBeenCalledTimes(1)
  })

  it('releases implicitly owned resources', () => {
    const global = new ResourceScope('global')
    const r = makeResource('r', { scope: global })
    global.release(r)
    expect(global.has(r)).toBe(false)
    expect(r.onEmpty).toHaveBeenCalledTimes(1)
  })

  it('ignores release of unknown resources', () => {
    const a = new ResourceScope('a')
    const r = makeResource('r')
    a.release(r)
    expect(r.onEmpty).not.toHaveBeenCalled()
  })

  it('owns children recursively', () => {
    const global = new ResourceScope('global')
    const a = global.createScope('a')
    const texture = makeResource('texture', { scope: global })
    const material = makeResource('material', { scope: global, children: [texture] })
    const mesh = makeResource('mesh', { scope: global, children: [material] })
    a.own(mesh)
    expect(a.count).toBe(3)
    expect(global.count).toBe(0)
    a.release(mesh)
    expect(a.count).toBe(0)
    expect(mesh.onEmpty).toHaveBeenCalledTimes(1)
    expect(material.onEmpty).toHaveBeenCalledTimes(1)
    expect(texture.onEmpty).toHaveBeenCalledTimes(1)
  })

  it('keeps a child that is owned directly', () => {
    const a = new ResourceScope('a')
    const texture = makeResource('texture')
    const material = makeResource('material', { children: [texture] })
    a.own(texture)
    a.own(material)
    a.release(material)
    expect(material.onEmpty).toHaveBeenCalledTimes(1)
    expect(texture.onEmpty).not.toHaveBeenCalled()
    expect(a.has(texture)).toBe(true)
  })

  it('keeps a child that is shared with another scope', () => {
    const a = new ResourceScope('a')
    const b = new ResourceScope('b')
    const texture = makeResource('texture')
    const material1 = makeResource('material1', { children: [texture] })
    const material2 = makeResource('material2', { children: [texture] })
    a.own(material1)
    b.own(material2)
    a.dispose()
    expect(material1.onEmpty).toHaveBeenCalledTimes(1)
    expect(texture.onEmpty).not.toHaveBeenCalled()
    b.dispose()
    expect(texture.onEmpty).toHaveBeenCalledTimes(1)
  })

  it('forgets finalized resources', () => {
    const a = new ResourceScope('a')
    const b = new ResourceScope('b')
    const r = makeResource('r')
    a.own(r)
    b.own(r)
    r.ownership.finalize()
    expect(a.has(r)).toBe(false)
    expect(b.has(r)).toBe(false)
    a.dispose()
    expect(r.onEmpty).not.toHaveBeenCalled()
  })

  it('throws when owning a finalized resource', () => {
    const a = new ResourceScope('a')
    const r = makeResource('r')
    r.ownership.finalize()
    expect(() => a.own(r)).toThrow()
    expect(a.has(r)).toBe(false)
  })

  it('releases resources in reverse order', () => {
    const a = new ResourceScope('a')
    const order: string[] = []
    const r1 = makeResource('r1')
    const r2 = makeResource('r2')
    r1.ownership.onEmpty(() => order.push('r1'))
    r2.ownership.onEmpty(() => order.push('r2'))
    a.own(r1)
    a.own(r2)
    a.dispose()
    expect(order).toEqual(['r2', 'r1'])
  })

  it('disposes child scopes first', () => {
    const global = new ResourceScope('global')
    const a = global.createScope('a')
    const order: string[] = []
    const r1 = makeResource('r1')
    const r2 = makeResource('r2')
    r1.ownership.onEmpty(() => order.push('global'))
    r2.ownership.onEmpty(() => order.push('a'))
    global.own(r1)
    a.own(r2)
    global.dispose()
    expect(order).toEqual(['a', 'global'])
    expect(a.isDisposed).toBe(true)
  })

  it('detaches from parent when disposed', () => {
    const global = new ResourceScope('global')
    const a = global.createScope('a')
    const r = makeResource('r')
    a.own(r)
    a.dispose()
    global.dispose()
    expect(r.onEmpty).toHaveBeenCalledTimes(1)
  })

  it('throws after dispose', () => {
    const a = new ResourceScope('a')
    a.dispose()
    a.dispose()
    expect(() => a.own(makeResource('r'))).toThrow()
    expect(() => a.createScope()).toThrow()
  })

  it('supports using declarations', () => {
    const r = makeResource('r')
    {
      using a = new ResourceScope('a')
      a.own(r)
    }
    expect(r.onEmpty).toHaveBeenCalledTimes(1)
  })
})
