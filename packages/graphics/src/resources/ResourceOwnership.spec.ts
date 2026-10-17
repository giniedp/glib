import { describe, expect, it, vi } from 'vitest'
import { type Ownable, ResourceOwnership } from './ResourceOwnership'

describe('ResourceOwnership', () => {
  function makeResource(name = 'r'): Ownable & { name: string } {
    const resource = { name } as { name: string; ownership: ResourceOwnership }
    resource.ownership = new ResourceOwnership(resource)
    return resource
  }

  it('is not owned initially', () => {
    const r = makeResource()
    expect(r.ownership.isOwned).toBe(false)
    expect(r.ownership.isClaimed).toBe(false)
    expect(r.ownership.isFinalized).toBe(false)
  })

  it('uses the name of the target', () => {
    expect(makeResource('texture').ownership.name).toBe('texture')
  })

  describe('adopt', () => {
    it('claims the child', () => {
      const parent = makeResource()
      const child = parent.ownership.adopt(makeResource())
      expect(child.ownership.isClaimed).toBe(true)
      expect(parent.ownership.children.has(child)).toBe(true)
    })

    it('adopts idempotently', () => {
      const parent = makeResource()
      const child = makeResource()
      parent.ownership.adopt(child)
      parent.ownership.adopt(child)
      expect(parent.ownership.children.size).toBe(1)
      parent.ownership.drop(child)
      expect(child.ownership.isFinalized).toBe(true)
    })

    it('refuses to adopt itself', () => {
      const r = makeResource()
      expect(() => r.ownership.adopt(r)).toThrow()
    })

    it('refuses to adopt into or from a finalized resource', () => {
      const parent = makeResource()
      const child = makeResource()
      child.ownership.finalize()
      expect(() => parent.ownership.adopt(child)).toThrow()
      parent.ownership.finalize()
      expect(() => parent.ownership.adopt(makeResource())).toThrow()
    })
  })

  describe('adoptUntilClaimed', () => {
    it('holds the child provisionally', () => {
      const holder = makeResource()
      const child = holder.ownership.adoptUntilClaimed(makeResource())
      expect(child.ownership.isOwned).toBe(true)
      expect(child.ownership.isClaimed).toBe(false)
      expect(holder.ownership.children.has(child)).toBe(true)
    })

    it('gives the child up when another owner claims it', () => {
      const holder = makeResource()
      const parent = makeResource()
      const child = holder.ownership.adoptUntilClaimed(makeResource())
      parent.ownership.adopt(child)
      expect(holder.ownership.children.has(child)).toBe(false)
      expect(child.ownership.isClaimed).toBe(true)
      parent.ownership.drop(child)
      expect(child.ownership.isFinalized).toBe(true)
    })

    it('is claimed when the provisional holder adopts it', () => {
      const holder = makeResource()
      const parent = makeResource()
      const child = holder.ownership.adoptUntilClaimed(makeResource())
      holder.ownership.adopt(child)
      parent.ownership.adopt(child)
      expect(holder.ownership.children.has(child)).toBe(true)
      parent.ownership.drop(child)
      expect(child.ownership.isFinalized).toBe(false)
    })

    it('has no effect on an owned child', () => {
      const holder = makeResource()
      const parent = makeResource()
      const child = parent.ownership.adopt(makeResource())
      holder.ownership.adoptUntilClaimed(child)
      expect(holder.ownership.children.has(child)).toBe(false)
    })

    it('finalizes the child when dropped', () => {
      const holder = makeResource()
      const child = holder.ownership.adoptUntilClaimed(makeResource())
      holder.ownership.drop(child)
      expect(child.ownership.isFinalized).toBe(true)
    })
  })

  describe('drop', () => {
    it('finalizes children without other owners', () => {
      const parent = makeResource()
      const child = parent.ownership.adopt(makeResource())
      parent.ownership.drop(child)
      expect(child.ownership.isFinalized).toBe(true)
      expect(parent.ownership.children.size).toBe(0)
    })

    it('keeps children that are held by another parent', () => {
      const parent1 = makeResource()
      const parent2 = makeResource()
      const child = parent1.ownership.adopt(makeResource())
      parent2.ownership.adopt(child)
      parent1.ownership.drop(child)
      expect(child.ownership.isFinalized).toBe(false)
      parent2.ownership.drop(child)
      expect(child.ownership.isFinalized).toBe(true)
    })

    it('ignores unknown children', () => {
      const parent = makeResource()
      const child = makeResource()
      parent.ownership.drop(child)
      expect(child.ownership.isFinalized).toBe(false)
    })
  })

  describe('finalize', () => {
    it('finalizes once and calls the handlers', () => {
      const r = makeResource()
      const onFinalize = vi.fn()
      r.ownership.onFinalize(onFinalize)
      r.ownership.finalize()
      r.ownership.finalize()
      expect(r.ownership.isFinalized).toBe(true)
      expect(onFinalize).toHaveBeenCalledTimes(1)
    })

    it('unsubscribes handlers', () => {
      const r = makeResource()
      const onFinalize = vi.fn()
      const off = r.ownership.onFinalize(onFinalize)
      off()
      r.ownership.finalize()
      expect(onFinalize).not.toHaveBeenCalled()
    })

    it('is removed from its owners', () => {
      const parent = makeResource()
      const child = parent.ownership.adopt(makeResource())
      child.ownership.finalize()
      expect(parent.ownership.children.size).toBe(0)
      expect(child.ownership.isOwned).toBe(false)
    })

    it('releases its children', () => {
      const parent = makeResource()
      const other = makeResource()
      const child1 = parent.ownership.adopt(makeResource())
      const child2 = parent.ownership.adopt(makeResource())
      other.ownership.adopt(child2)
      parent.ownership.finalize()
      expect(child1.ownership.isFinalized).toBe(true)
      expect(child2.ownership.isFinalized).toBe(false)
      expect(parent.ownership.children.size).toBe(0)
    })
  })

  describe('setReleaseHandler', () => {
    it('is called instead of finalizing when the last owner lets go', () => {
      const parent = makeResource()
      const child = parent.ownership.adopt(makeResource())
      const handler = vi.fn()
      child.ownership.setReleaseHandler(handler)
      parent.ownership.drop(child)
      expect(handler).toHaveBeenCalledTimes(1)
      expect(child.ownership.isFinalized).toBe(false)
      expect(child.ownership.isOwned).toBe(false)
    })

    it('is called again after the resource was owned again', () => {
      const parent = makeResource()
      const child = makeResource()
      const handler = vi.fn()
      child.ownership.setReleaseHandler(handler)
      parent.ownership.adopt(child)
      parent.ownership.drop(child)
      parent.ownership.adopt(child)
      parent.ownership.drop(child)
      expect(handler).toHaveBeenCalledTimes(2)
    })

    it('is not called while other owners remain', () => {
      const parent1 = makeResource()
      const parent2 = makeResource()
      const child = parent1.ownership.adopt(makeResource())
      parent2.ownership.adopt(child)
      const handler = vi.fn()
      child.ownership.setReleaseHandler(handler)
      parent1.ownership.drop(child)
      expect(handler).not.toHaveBeenCalled()
    })
  })
})
