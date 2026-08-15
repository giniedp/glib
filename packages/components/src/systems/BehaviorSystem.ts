import { ComponentIds, GameComponentId, GameEntity, GameSystem, GameWorld } from '@gglib/ecs'
import { idMap } from '@gglib/utils'

/**
 * A component that implements this interface will be automatically updated by the {@link BehaviorSystem}
 */
export interface BehaviorComponent {
  /**
   * Update method that will be called by the {@link BehaviorSystem} every frame
   *
   * @param time - current time in ms
   * @param delta - time elapsed since last update in ms
   */
  updateBehavior(time: number, delta: number): void
}

function isBehaviorComponent(component: any): component is BehaviorComponent {
  return typeof (component as BehaviorComponent).updateBehavior === 'function'
}

/**
 * A system that automatically updates all components that implement the {@link BehaviorComponent} interface
 */
export class BehaviorSystem extends GameSystem {
  private world: GameWorld
  private components = idMap<GameComponentId, BehaviorComponent>()
  override initialize(world: GameWorld): void {
    this.world = world

    world.eventBus.on(GameEntity.onActivated, this.addComponents)
    world.eventBus.on(GameEntity.onDeactivating, this.removeComponents)
  }

  override update(time: number, delta: number): void {
    const items = this.components
    for (const id of items.keys) {
      try {
        items.get(id).updateBehavior(time, delta)
      } catch (error) {
        console.error(`Error in behavior component:`, error, items.get(id))
      }
    }
  }

  override destroy(): void {
    if (this.world) {
      this.world.eventBus.off(GameEntity.onActivated, this.addComponents)
      this.world.eventBus.off(GameEntity.onDeactivating, this.removeComponents)
    }
  }

  private addComponents = (entity: GameEntity) => {
    for (const component of entity.activeComponents) {
      if (isBehaviorComponent(component)) {
        const id = ComponentIds.get(component)
        this.components.set(id, component)
      }
    }
  }

  private removeComponents = (entity: GameEntity) => {
    for (const component of entity.activeComponents) {
      const id = ComponentIds.get(component)
      this.components.delete(id)
    }
  }
}
