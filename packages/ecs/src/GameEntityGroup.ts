import { removeItemUnordered } from '@gglib/utils'
import type { GameComponent } from './GameComponent'
import { GameEntity } from './GameEntity'

export class GameObjectGroup implements GameComponent {
  public readonly entities: GameEntity[] = []
  public readonly entity: GameEntity
  private toInitialize: GameEntity[] = []
  private toActivate: GameEntity[] = []
  private isInitialized = false
  private isActive = false

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
    if (!entity.isInitialized) {
      entity.initialize()
    }
    if (!entity.isActive) {
      entity.activate()
    }
  }

  public remove(entity: GameEntity, keepActive?: boolean) {
    if (!keepActive) {
      entity.deactivate()
    }
    removeItemUnordered(this.entities, entity)
    removeItem(this.toInitialize, entity)
    removeItem(this.toActivate, entity)
  }

  public clear() {
    this.entities.length = 0
    this.toInitialize.length = 0
    this.toActivate.length = 0
  }

  public get length() {
    return this.entities.length
  }

  public initialize() {
    while (this.toInitialize.length > 0) {
      const entity = this.toInitialize.pop()
      if (!entity.isInitialized) {
        entity.initialize()
      }
      this.toActivate.push(entity)
    }
    this.isInitialized = true
  }

  public activate() {
    while (this.toActivate.length > 0) {
      const entity = this.toActivate.pop()
      if (!entity.isActive) {
        entity.activate()
      }
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
}

function removeItem<T>(array: T[], item: T) {
  const index = array.indexOf(item)
  if (index > -1) {
    array.splice(index, 1)
  }
}
