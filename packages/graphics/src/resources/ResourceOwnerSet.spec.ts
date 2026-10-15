import { describe, expect, it, vi } from 'vitest'
import { type Ownable, type ResourceOwner, ResourceOwnerSet } from './ResourceOwnerSet'

describe('ResourceOwnerSet', () => {
  function makeOwner(name: string): ResourceOwner & { detached: Ownable[] } {
    const detached: Ownable[] = []
    return { name, detached, detach: (r) => detached.push(r) }
  }

  function makeResource(defaultOwner?: ResourceOwner): Ownable {
    const resource = {} as { owners: ResourceOwnerSet }
    resource.owners = new ResourceOwnerSet(resource, defaultOwner)
    return resource
  }

  it('is owned by the default owner', () => {
    const global = makeOwner('global')
    const r = makeResource(global)
    expect(r.owners.defaultOwner).toBe(global)
    expect(r.owners.size).toBe(1)
    expect(r.owners.has(global)).toBe(true)
    expect(r.owners.isExplicit(global)).toBe(false)
  })

  it('triggers onEmpty when default owner is deleted', () => {
    const global = makeOwner('global')
    const r = makeResource(global)
    const onEmpty = vi.fn()
    r.owners.onEmpty(onEmpty)
    expect(r.owners.delete(global)).toBe(true)
    expect(onEmpty).toHaveBeenCalledTimes(1)
    expect(r.owners.isOwned).toBe(false)
    expect(global.detached).toEqual([r])
  })

  it('moves ownership from default owner on first add', () => {
    const global = makeOwner('global')
    const a = makeOwner('a')
    const r = makeResource(global)
    expect(r.owners.add(a)).toBe(true)
    expect(r.owners.defaultOwner).toBe(null)
    expect(r.owners.has(global)).toBe(false)
    expect(r.owners.size).toBe(1)
    expect(global.detached).toEqual([r])
  })

  it('promotes default owner to explicit owner', () => {
    const global = makeOwner('global')
    const a = makeOwner('a')
    const r = makeResource(global)
    r.owners.add(global)
    r.owners.add(a)
    expect(r.owners.isExplicit(global)).toBe(true)
    expect(r.owners.isExplicit(a)).toBe(true)
    expect(r.owners.size).toBe(2)
    expect(global.detached).toEqual([])
  })

  it('adds owners idempotently', () => {
    const a = makeOwner('a')
    const r = makeResource()
    expect(r.owners.add(a)).toBe(true)
    expect(r.owners.add(a)).toBe(false)
    expect(r.owners.size).toBe(1)
  })

  it('triggers onEmpty once after last owner is deleted', () => {
    const a = makeOwner('a')
    const b = makeOwner('b')
    const r = makeResource()
    const onEmpty = vi.fn()
    r.owners.onEmpty(onEmpty)
    r.owners.add(a)
    r.owners.add(b)
    r.owners.delete(a)
    expect(onEmpty).not.toHaveBeenCalled()
    r.owners.delete(b)
    expect(onEmpty).toHaveBeenCalledTimes(1)
    expect(r.owners.delete(b)).toBe(false)
    expect(onEmpty).toHaveBeenCalledTimes(1)
  })

  it('triggers onRevive only after being emptied', () => {
    const a = makeOwner('a')
    const r = makeResource()
    const onRevive = vi.fn()
    r.owners.onRevive(onRevive)
    r.owners.add(a)
    expect(onRevive).not.toHaveBeenCalled()
    r.owners.delete(a)
    r.owners.add(a)
    expect(onRevive).toHaveBeenCalledTimes(1)
  })

  it('unsubscribes handlers', () => {
    const a = makeOwner('a')
    const r = makeResource(a)
    const onEmpty = vi.fn()
    const off = r.owners.onEmpty(onEmpty)
    off()
    r.owners.delete(a)
    expect(onEmpty).not.toHaveBeenCalled()
  })

  it('finalizes and detaches all owners', () => {
    const global = makeOwner('global')
    const a = makeOwner('a')
    const r = makeResource(global)
    r.owners.add(global)
    r.owners.add(a)
    const onEmpty = vi.fn()
    const onFinalize = vi.fn()
    r.owners.onEmpty(onEmpty)
    r.owners.onFinalize(onFinalize)
    r.owners.finalize()
    r.owners.finalize()
    expect(r.owners.isFinalized).toBe(true)
    expect(r.owners.size).toBe(0)
    expect(global.detached).toEqual([r])
    expect(a.detached).toEqual([r])
    expect(onFinalize).toHaveBeenCalledTimes(1)
    expect(onEmpty).not.toHaveBeenCalled()
    expect(() => r.owners.add(a)).toThrow()
  })
})
