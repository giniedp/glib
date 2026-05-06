import { archetypeKey, GameArchetype } from './GameArchetype'
import type { GameComponentTypeId } from './GameComponent'
import type { GameEntityId } from './GameEntity'
import { GameQuery, type GameQueryDescriptor } from './GameQuery'
import type { GameWorld } from './GameWorld'

export class GameQueryCache {
  private archetypes: GameArchetype[] = []
  private queries: GameQuery[] = []
  private archetypesByEntity = new Map<GameEntityId, GameArchetype>()
  private world: GameWorld
  public constructor(world: GameWorld) {
    this.world = world
  }

  protected getArchetype(types: ReadonlyArray<GameComponentTypeId>): GameArchetype {
    for (let i = 0; i < this.archetypes.length; i++) {
      if (arraysEqual(this.archetypes[i].types, types)) {
        return this.archetypes[i]
      }
    }
    const archetype = new GameArchetype([...types])
    this.archetypes.push(archetype)
    for (const query of this.queries) {
      query.checkArchetype(archetype)
    }
    return archetype
  }

  public getQuery(descriptor: GameQueryDescriptor): GameQuery
  public getQuery(types: GameComponentTypeId[]): GameQuery
  public getQuery(typesOrDescriptor: GameQueryDescriptor | GameComponentTypeId[]): GameQuery {
    const desc: Required<GameQueryDescriptor> = {
      required: [],
      optional: [],
      rejected: [],
    }
    if (Array.isArray(typesOrDescriptor)) {
      desc.required = typesOrDescriptor
    } else {
      desc.required = typesOrDescriptor.required ?? []
      desc.optional = typesOrDescriptor.optional ?? []
      desc.rejected = typesOrDescriptor.rejected ?? []
    }

    for (let i = 0; i < this.queries.length; i++) {
      if (queryEquals(this.queries[i], desc)) {
        return this.queries[i]
      }
    }
    const query = new GameQuery(desc, this.world)
    this.queries.push(query)
    for (const archetype of this.archetypes) {
      query.checkArchetype(archetype)
    }
    return query
  }

  public addEntity(entityId: GameEntityId, componentTypes: GameComponentTypeId[]): void {
    this.removeEntity(entityId)
    const key = archetypeKey(componentTypes)
    const archetype = this.getArchetype(key)
    archetype.addEntity(entityId)
    this.archetypesByEntity.set(entityId, archetype)
  }

  public removeEntity(entityId: GameEntityId) {
    const archetype = this.archetypesByEntity.get(entityId)
    if (archetype) {
      archetype.removeEntity(entityId)
      this.archetypesByEntity.delete(entityId)
    }
  }
}

function arraysEqual<T extends Number>(a: ReadonlyArray<T>, b: ReadonlyArray<T>): boolean {
  if (a.length !== b.length) {
    return false
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false
    }
  }
  return true
}

function queryEquals(q: GameQuery, spec: Required<GameQueryDescriptor>): boolean {
  return (
    arraysEqual(q.required, spec.required) &&
    arraysEqual(q.optional, spec.optional) &&
    arraysEqual(q.rejected, spec.rejected)
  )
}
