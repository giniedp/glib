import { beforeEach, describe, expect, it } from 'vitest'
import { ComponentTypeIds, type GameComponentTypeId } from './GameComponent'
import type { GameEntityId } from './GameEntity'
import { GameQueryCache } from './GameQueryCache'

class A {}
class B {}
class C {}
class D {}

describe('Archetype', () => {
  let cache: GameQueryCache
  let cTypeA: GameComponentTypeId
  let cTypeB: GameComponentTypeId
  let cTypeC: GameComponentTypeId
  let cTypeD: GameComponentTypeId
  let entity1: GameEntityId
  let entity2: GameEntityId
  let entity3: GameEntityId
  let entity4: GameEntityId

  beforeEach(() => {
    cache = new GameQueryCache(null)
    cTypeA = ComponentTypeIds.getOrCreate(A)
    cTypeB = ComponentTypeIds.getOrCreate(B)
    cTypeC = ComponentTypeIds.getOrCreate(C)
    cTypeD = ComponentTypeIds.getOrCreate(D)
    entity1 = 1 as GameEntityId
    entity2 = 2 as GameEntityId
    entity3 = 3 as GameEntityId
    entity4 = 4 as GameEntityId

    cache.addEntity(entity1, [cTypeA, cTypeB])
    cache.addEntity(entity2, [cTypeA, cTypeC])
    cache.addEntity(entity3, [cTypeB, cTypeC])
    cache.addEntity(entity4, [cTypeA, cTypeB, cTypeC])
  })

  describe('required', () => {
    it('[cTypeA, cTypeB] -> [entity1, entity4]', () => {
      const result = cache.getQuery({ required: [cTypeA, cTypeB] }).toIdArray()
      expect(result).toEqual([entity1, entity4])
    })

    it('[cTypeA] -> [entity1, entity2, entity4]', () => {
      const result = cache.getQuery({ required: [cTypeA] }).toIdArray()
      expect(result).toEqual([entity1, entity2, entity4])
    })

    it('[cTypeB] -> [entity1, entity3, entity4]', () => {
      const result = cache.getQuery({ required: [cTypeB] }).toIdArray()
      expect(result).toEqual([entity1, entity3, entity4])
    })

    it('[cTypeC] -> [entity2, entity3, entity4]', () => {
      const result = cache.getQuery({ required: [cTypeC] }).toIdArray()
      expect(result).toEqual([entity2, entity3, entity4])
    })

    it('[cTypeD] -> []', () => {
      const result = cache.getQuery({ required: [cTypeD] }).toIdArray()
      expect(result).toEqual([])
    })
  })

  describe('optional', () => {
    it('[cTypeA] -> [entity2, entity3, entity4]', () => {
      const query = cache.getQuery({ optional: [cTypeA] })
      const result = query.toIdArray()
      expect(result).toEqual([entity1, entity2, entity4])
    })

    it('[cTypeC] -> [entity2, entity3, entity4]', () => {
      const query = cache.getQuery({ optional: [cTypeC] })
      expect(query.required).toEqual([])
      expect(query.optional).toEqual([cTypeC])
      expect(query.rejected).toEqual([])

      const result = query.toIdArray()
      expect(result).toEqual([entity2, entity3, entity4])
    })

    it('[cTypeD] -> []', () => {
      const query = cache.getQuery({ optional: [cTypeD] })
      const result = query.toIdArray()
      expect(result).toEqual([])
    })
  })

  describe('rejected', () => {
    it('require A, reject B -> [entity2]', () => {
      const query = cache.getQuery({ required: [cTypeA], rejected: [cTypeB] })
      const result = query.toIdArray()
      expect(result).toEqual([entity2])
    })

    it('require A, reject C -> [entity1]', () => {
      const query = cache.getQuery({ required: [cTypeA], rejected: [cTypeC] })
      const result = query.toIdArray()
      expect(result).toEqual([entity1])
    })
  })
})
