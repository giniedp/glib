import { removeFromArrayUnstable } from '@gglib/utils'
import { GameEntity } from './GameEntity'
import type { GameProvider } from './GameSystem'

export class GameEntityCollection {
  public readonly entities: GameEntity[] = []
  private toInitialize: GameEntity[] = []
  private toActivate: GameEntity[] = []
  private isInitialized = false
  private isActive = false
  private game: GameProvider
  public add(entity: GameEntity) {
    if (!entity) {
      throw new Error('Cannot add null or undefined entity to collection')
    }
    this.entities.push(entity)
    if (!this.isInitialized) {
      this.toInitialize.push(entity)
      return
    }
    if (!this.isActive) {
      this.toActivate.push(entity)
      return
    }
    entity.initialize(this.game)
    entity.activate()
  }

  public remove(entity: GameEntity) {
    removeFromArrayUnstable(this.entities, entity)
    removeFromArray(this.toInitialize, entity)
    removeFromArray(this.toActivate, entity)
  }

  public clear() {
    this.entities.length = 0
    this.toInitialize.length = 0
    this.toActivate.length = 0
  }

  public get length() {
    return this.entities.length
  }

  public initialize(game: GameProvider) {
    this.game = game
    while (this.toInitialize.length > 0) {
      const entity = this.toInitialize.pop()
      entity.initialize(game)
      this.toActivate.push(entity)
    }
    this.isInitialized = true
  }

  public activate() {
    while (this.toActivate.length > 0) {
      const entity = this.toActivate.pop()
      entity.activate()
    }
    this.isActive = true
  }

  public deactivate() {
    for (const entity of this.entities) {
      entity.deactivate()
      this.toActivate.push(entity)
    }
    this.isActive = false
  }

  public destroy() {
    for (const entity of this.entities) {
      entity.destroy()
    }
    this.clear()
  }

  public create(name?: string, id?: number | string) {
    const entity = new GameEntity()
    entity.name = name
    entity.id = id
    this.add(entity)
    return entity
  }
}

function removeFromArray<T>(array: T[], item: T) {
  const index = array.indexOf(item)
  if (index > -1) {
    array.splice(index, 1)
  }
}
