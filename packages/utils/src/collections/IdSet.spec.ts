import { beforeEach, describe, expect, it } from 'vitest'
import { idSet, type IdSet } from './IdSet'

describe('IDSet', () => {
  let set: IdSet
  const entity1 = 1
  const entity2 = 2
  const entity3 = 3

  beforeEach(() => {
    set = idSet()
  })

  it('should be empty initially', () => {
    expect(set.size).toBe(0)
    expect(set.values).toEqual([])
  })

  it('should add', () => {
    set.add(entity1)
    expect(set.size).toBe(1)
    expect(set.values).toEqual([entity1])
    expect(set.has(entity1)).toBe(true)
    expect(set.has(entity2)).toBe(false)
    expect(set.has(entity3)).toBe(false)
    expect(Array.from(set)).toEqual([entity1])

    set.add(entity3)
    expect(set.size).toBe(2)
    expect(set.values).toEqual([entity1, entity3])
    expect(set.has(entity1)).toBe(true)
    expect(set.has(entity2)).toBe(false)
    expect(set.has(entity3)).toBe(true)
    expect(Array.from(set)).toEqual([entity1, entity3])

    set.add(entity2)
    expect(set.size).toBe(3)
    expect(set.values).toEqual([entity1, entity3, entity2])
    expect(set.has(entity1)).toBe(true)
    expect(set.has(entity2)).toBe(true)
    expect(set.has(entity3)).toBe(true)
    expect(Array.from(set)).toEqual([entity1, entity3, entity2])
  })

  it('should remove', () => {
    set.add(entity1)
    set.add(entity2)
    set.add(entity3)

    expect(set.has(entity1)).toBe(true)
    expect(set.has(entity2)).toBe(true)
    expect(set.has(entity3)).toBe(true)
    expect(Array.from(set)).toEqual([entity1, entity2, entity3])

    set.delete(entity2)
    expect(set.size).toBe(2)
    expect(set.values).toEqual([entity1, entity3])
    expect(set.has(entity1)).toBe(true)
    expect(set.has(entity2)).toBe(false)
    expect(set.has(entity3)).toBe(true)
    expect(Array.from(set)).toEqual([entity1, entity3])

    set.delete(entity1)
    expect(set.size).toBe(1)
    expect(set.values).toEqual([entity3])
    expect(set.has(entity1)).toBe(false)
    expect(set.has(entity2)).toBe(false)
    expect(set.has(entity3)).toBe(true)
    expect(Array.from(set)).toEqual([entity3])

    set.delete(entity3)
    expect(set.size).toBe(0)
    expect(set.values).toEqual([])
    expect(set.has(entity1)).toBe(false)
    expect(set.has(entity2)).toBe(false)
    expect(set.has(entity3)).toBe(false)
    expect(Array.from(set)).toEqual([])
  })
})
