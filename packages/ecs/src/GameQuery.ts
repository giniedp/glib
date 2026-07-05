import { archetypeKey, type GameArchetype, type GameArchetypeKey } from './GameArchetype'
import type { GameComponentTypeId } from './GameComponent'
import type { GameEntity, GameEntityId } from './GameEntity'
import { GameWorld } from './GameWorld'
import { createStaticIterator, DONE } from './utils/staticIterator'

export interface GameQueryDescriptor {
  required?: GameComponentTypeId[]
  optional?: GameComponentTypeId[]
  rejected?: GameComponentTypeId[]
}

export class GameQuery {
  public readonly required: GameArchetypeKey
  public readonly optional: GameArchetypeKey
  public readonly rejected: GameArchetypeKey
  private readonly archetypes: GameArchetype[] = []
  protected world: GameWorld

  public constructor(descriptor: GameQueryDescriptor, world: GameWorld) {
    this.world = world
    this.required = archetypeKey(descriptor.required ?? [])
    this.optional = archetypeKey(descriptor.optional ?? [])
    this.rejected = archetypeKey(descriptor.rejected ?? [])
  }

  public checkArchetype(archetype: GameArchetype): void {
    const types = archetype.types

    if (this.required.length > 0 && !isSuperset(types, this.required)) {
      return
    }

    if (this.optional.length > 0 && !intersects(types, this.optional)) {
      return
    }

    if (this.rejected.length > 0 && intersects(types, this.rejected)) {
      return
    }

    if (!this.archetypes.includes(archetype)) {
      this.archetypes.push(archetype)
    }
  }

  /**
   * Returns the total number of entities in this query.
   * Note that this method iterates over all archetypes and counts their entities.
   */
  public count() {
    let count = 0
    for (let i = 0; i < this.archetypes.length; i++) {
      count += this.archetypes[i].size
    }
    return count
  }

  public forEachId(fn: (entityId: GameEntityId, index: number) => void): void {
    let i = 0
    for (let aIndex = 0; aIndex < this.archetypes.length; aIndex++) {
      const arch = this.archetypes[aIndex]
      for (let eIndex = 0; eIndex < arch.size; eIndex++) {
        fn(arch.entities[eIndex], i++)
      }
    }
  }

  public mapId<T>(fn: (entityId: GameEntityId, index: number) => T): T[] {
    const result: T[] = []
    this.forEachId((entityId, index) => {
      result.push(fn(entityId, index))
    })
    return result
  }

  public toIdArray(result: GameEntityId[] = []): GameEntityId[] {
    this.forEachId((entityId) => {
      result.push(entityId)
    })
    return result
  }

  public forEach(fn: (entity: GameEntity, id: GameEntityId) => void): void {
    for (let aIndex = 0; aIndex < this.archetypes.length; aIndex++) {
      const arch = this.archetypes[aIndex]
      for (let eIndex = 0; eIndex < arch.size; eIndex++) {
        const id = arch.entities[eIndex]
        fn(this.world.getEntity(id), id)
      }
    }
  }

  public map<T>(fn: (entity: GameEntity, id: GameEntityId) => T): T[] {
    const result: T[] = []
    this.forEach((entityId, index) => {
      result.push(fn(entityId, index))
    })
    return result
  }

  public toArray(result: GameEntity[] = []): GameEntity[] {
    this.forEach((it) => result.push(it))
    return result
  }

  public [Symbol.iterator]: () => Iterator<GameEntity> = createStaticIterator({
    state: () => ({
      types: this.archetypes,
      arch: this.archetypes[0] ?? null,
      archIndex: 0,
      entIndex: 0,
    }),
    start: (state) => {
      state.types = this.archetypes
      state.arch = this.archetypes[0] ?? null
      state.archIndex = 0
      state.entIndex = 0
    },
    next: (state) => {
      if (state.arch && state.entIndex < state.arch.size) {
        const id = state.arch.entities[state.entIndex++]
        return this.world.getEntity(id)
      }

      // advance to next non-empty archetype
      while (++state.archIndex < state.types.length) {
        const arch = state.types[state.archIndex]
        if (arch.size > 0) {
          state.arch = arch
          state.entIndex = 0
          // inline first entity
          const id = arch.entities[state.entIndex++]
          return this.world.getEntity(id)
        }
      }

      return DONE
    },
  })
}

function isSuperset<T extends number>(a: ReadonlyArray<T>, b: ReadonlyArray<T>): boolean {
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++
      j++
    } else if (a[i] < b[j]) {
      i++
    } else {
      return false
    }
  }

  return j === b.length
}

function intersects<T extends number>(a: ReadonlyArray<T>, b: ReadonlyArray<T>): boolean {
  let i = 0
  let j = 0

  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      return true
    }
    if (a[i] < b[j]) {
      i++
    } else {
      j++
    }
  }

  return false
}
