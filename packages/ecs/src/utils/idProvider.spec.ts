import { beforeEach, describe, expect, it } from 'vitest'
import { idProvider, type IdProvider } from './idProvider'

describe('idProvider', () => {
  let provider: IdProvider<number, object>

  beforeEach(() => {
    provider = idProvider(Symbol('test'))
  })

  it('should generate unique ids', () => {
    const type1 = {}
    const type2 = {}
    const type3 = {}

    const id1 = provider.getOrCreate(type1)
    const id2 = provider.getOrCreate(type2)
    const id3 = provider.getOrCreate(type3)

    expect(id1).toBe(1)
    expect(id2).toBe(2)
    expect(id3).toBe(3)
  })

  it('should return the same id for the same type', () => {
    const type = {}

    const id1 = provider.getOrCreate(type)
    const id2 = provider.getOrCreate(type)

    expect(id1).toBe(id2)
  })

  it('should return null for unknown types', () => {
    const type = {}

    const id = provider.get(type)

    expect(id).toBeNull()
  })
})
