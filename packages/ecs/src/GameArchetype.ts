import type { GameComponentTypeId } from './GameComponent'
import type { GameEntityId } from './GameEntity'

export type GameArchetypeKey = ReadonlyArray<GameComponentTypeId>

export function archetypeKey(types: ReadonlyArray<GameComponentTypeId>): GameArchetypeKey {
  return types.toSorted(compare)
}

function compare(a: GameComponentTypeId, b: GameComponentTypeId): number {
  return a - b
}

export class GameArchetype {
  public types: GameArchetypeKey
  public entities: GameEntityId[] = []
  public size = 0
  private entityToIndex: Record<GameEntityId, number> = Object.create(null)

  public constructor(types: GameArchetypeKey) {
    this.types = types
  }

  public addEntity(entityId: GameEntityId): void {
    const index = this.size++
    this.entities[index] = entityId
    this.entityToIndex[entityId] = index
  }

  public removeEntity(entityId: GameEntityId): boolean {
    const index = this.entityToIndex[entityId]
    if (index == null || index >= this.size) {
      return false
    }
    const lastIndex = --this.size
    const lastEntity = this.entities[lastIndex]

    this.entities[index] = lastEntity
    this.entityToIndex[lastEntity] = index

    delete this.entityToIndex[entityId]
    this.entities.length = this.size
    return true
  }
}
