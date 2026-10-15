import { describe, expect, it, vi } from 'vitest'
import { type Ownable, type ResourceOwner, ResourceOwnership } from './ResourceOwnership'

describe('ResourceOwnership', () => {
  function makeOwner(name: string): ResourceOwner & { detached: Ownable[] } {
    const detached: Ownable[] = []
    return { name, detached, detach: (r) => detached.push(r), release: () => {}, own: (r) => r }
  }

  function makeResource(defaultOwner?: ResourceOwner): Ownable {
    const resource = {} as { ownership: ResourceOwnership }
    resource.ownership = new ResourceOwnership(resource, defaultOwner)
    return resource
  }

  it('is owned by the default owner', () => {
    const global = makeOwner('global')
    const r = makeResource(global)
    expect(r.ownership.defaultOwner).toBe(global)
    expect(r.ownership.size).toBe(1)
    expect(r.ownership.has(global)).toBe(true)
    expect(r.ownership.isExplicit(global)).toBe(false)
  })

  it('triggers onEmpty when default owner is deleted', () => {
    const global = makeOwner('global')
    const r = makeResource(global)
    const onEmpty = vi.fn()
    r.ownership.onEmpty(onEmpty)
    expect(r.ownership.delete(global)).toBe(true)
    expect(onEmpty).toHaveBeenCalledTimes(1)
    expect(r.ownership.isOwned).toBe(false)
    expect(global.detached).toEqual([r])
  })

  it('moves ownership from default owner on first add', () => {
    const global = makeOwner('global')
    const a = makeOwner('a')
    const r = makeResource(global)
    expect(r.ownership.add(a)).toBe(true)
    expect(r.ownership.defaultOwner).toBe(null)
    expect(r.ownership.has(global)).toBe(false)
    expect(r.ownership.size).toBe(1)
    expect(global.detached).toEqual([r])
  })

  it('promotes default owner to explicit owner', () => {
    const global = makeOwner('global')
    const a = makeOwner('a')
    const r = makeResource(global)
    r.ownership.add(global)
    r.ownership.add(a)
    expect(r.ownership.isExplicit(global)).toBe(true)
    expect(r.ownership.isExplicit(a)).toBe(true)
    expect(r.ownership.size).toBe(2)
    expect(global.detached).toEqual([])
  })

  it('adds owners idempotently', () => {
    const a = makeOwner('a')
    const r = makeResource()
    expect(r.ownership.add(a)).toBe(true)
    expect(r.ownership.add(a)).toBe(false)
    expect(r.ownership.size).toBe(1)
  })

  it('triggers onEmpty once after last owner is deleted', () => {
    const a = makeOwner('a')
    const b = makeOwner('b')
    const r = makeResource()
    const onEmpty = vi.fn()
    r.ownership.onEmpty(onEmpty)
    r.ownership.add(a)
    r.ownership.add(b)
    r.ownership.delete(a)
    expect(onEmpty).not.toHaveBeenCalled()
    r.ownership.delete(b)
    expect(onEmpty).toHaveBeenCalledTimes(1)
    expect(r.ownership.delete(b)).toBe(false)
    expect(onEmpty).toHaveBeenCalledTimes(1)
  })

  it('triggers onRevive only after being emptied', () => {
    const a = makeOwner('a')
    const r = makeResource()
    r.ownership.markShared()
    const onRevive = vi.fn()
    r.ownership.onRevive(onRevive)
    r.ownership.add(a)
    expect(onRevive).not.toHaveBeenCalled()
    r.ownership.delete(a)
    r.ownership.add(a)
    expect(onRevive).toHaveBeenCalledTimes(1)
  })

  it('unsubscribes handlers', () => {
    const a = makeOwner('a')
    const r = makeResource(a)
    const onEmpty = vi.fn()
    const off = r.ownership.onEmpty(onEmpty)
    off()
    r.ownership.delete(a)
    expect(onEmpty).not.toHaveBeenCalled()
  })

  it('finalizes and detaches all owners', () => {
    const global = makeOwner('global')
    const a = makeOwner('a')
    const r = makeResource(global)
    r.ownership.add(global)
    r.ownership.add(a)
    const onEmpty = vi.fn()
    const onFinalize = vi.fn()
    r.ownership.onEmpty(onEmpty)
    r.ownership.onFinalize(onFinalize)
    r.ownership.finalize()
    r.ownership.finalize()
    expect(r.ownership.isFinalized).toBe(true)
    expect(r.ownership.size).toBe(0)
    expect(global.detached).toEqual([r])
    expect(a.detached).toEqual([r])
    expect(onFinalize).toHaveBeenCalledTimes(1)
    expect(onEmpty).not.toHaveBeenCalled()
    expect(() => r.ownership.add(a)).toThrow()
  })

  it('finalizes when the last owner is removed', () => {
    const a = makeOwner('a')
    const r = makeResource(a)
    r.ownership.delete(a)
    expect(r.ownership.isFinalized).toBe(true)
  })

  it('keeps shared resources alive when the last owner is removed', () => {
    const a = makeOwner('a')
    const r = makeResource(a)
    r.ownership.markShared()
    r.ownership.delete(a)
    expect(r.ownership.isFinalized).toBe(false)
  })

  describe('children', () => {
    it('passes current owners to adopted children', () => {
      const owned: Ownable[] = []
      const a = { ...makeOwner('a'), own: <T extends Ownable>(r: T) => (owned.push(r), r) }
      const parent = makeResource()
      parent.ownership.add(a)
      const child = parent.ownership.adopt(makeResource())
      expect(owned).toEqual([child])
      expect(Array.from(parent.ownership.children)).toEqual([child])
    })

    it('finalizes children with the parent', () => {
      const parent = makeResource()
      const child = parent.ownership.adopt(makeResource())
      parent.ownership.finalize()
      expect(child.ownership.isFinalized).toBe(true)
    })

    it('does not finalize shared children', () => {
      const parent = makeResource()
      const child = makeResource()
      child.ownership.markShared()
      parent.ownership.adopt(child)
      parent.ownership.finalize()
      expect(child.ownership.isFinalized).toBe(false)
    })

    it('does not finalize explicitly owned children', () => {
      const parent = makeResource()
      const child = parent.ownership.adopt(makeResource())
      child.ownership.add(makeOwner('a'))
      parent.ownership.finalize()
      expect(child.ownership.isFinalized).toBe(false)
    })

    it('finalizes dropped children', () => {
      const released: Ownable[] = []
      const a = { ...makeOwner('a'), release: (r: Ownable) => released.push(r) }
      const parent = makeResource()
      parent.ownership.add(a)
      const child = parent.ownership.adopt(makeResource())
      parent.ownership.drop(child)
      expect(released).toEqual([child])
      expect(child.ownership.isFinalized).toBe(true)
      expect(Array.from(parent.ownership.children)).toEqual([])
    })
  })
})
