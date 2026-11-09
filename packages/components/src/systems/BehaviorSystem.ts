import { ComponentIds, GameComponentId, GameEntity, GameSystem, GameWorld, SystemOrder } from '@gglib/ecs'
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
  /**
   * Update order within the {@link BehaviorSystem}, lower runs first. Components with the same order run in the
   * order they were activated. Defaults to {@link BehaviorOrder.Default}.
   */
  readonly behaviorOrder?: number
}

/**
 * Common values of {@link BehaviorComponent.behaviorOrder}
 */
export const BehaviorOrder = {
  /**
   * Controllers and constraints that move entities
   */
  Default: 0,
  /**
   * Behaviors that read the final transforms of the frame, e.g. cameras compute their view matrices after the
   * controllers moved them
   */
  Late: 1000,
}

function isBehaviorComponent(component: any): component is BehaviorComponent {
  return typeof (component as BehaviorComponent).updateBehavior === 'function'
}

/**
 * A system that automatically updates all components that implement the {@link BehaviorComponent} interface
 */
export class BehaviorSystem extends GameSystem {
  public override order: number = SystemOrder.Behavior

  private world: GameWorld
  private components = idMap<GameComponentId, BehaviorComponent>()
  /**
   * The components in update order, rebuilt when components were added or removed
   */
  private sorted: Array<{ id: GameComponentId; component: BehaviorComponent }> = []
  private isSorted = true

  override initialize(world: GameWorld): void {
    this.world = world

    world.eventBus.on(GameEntity.onActivated, this.addComponents)
    world.eventBus.on(GameEntity.onDeactivating, this.removeComponents)
  }

  override update(time: number, delta: number): void {
    if (!this.isSorted) {
      this.sort()
    }
    for (const { id, component } of this.sorted) {
      // removed by an earlier behavior of this frame
      if (this.components.get(id) !== component) {
        continue
      }
      try {
        component.updateBehavior(time, delta)
      } catch (error) {
        console.error(`Error in behavior component:`, error, component)
      }
    }
  }

  private sort() {
    const items = this.components
    this.sorted.length = 0
    for (const id of items.keys) {
      this.sorted.push({ id, component: items.get(id) })
    }
    // Array.prototype.sort is stable, equal orders keep the activation order
    this.sorted.sort(
      (a, b) =>
        (a.component.behaviorOrder ?? BehaviorOrder.Default) - (b.component.behaviorOrder ?? BehaviorOrder.Default),
    )
    this.isSorted = true
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
        this.isSorted = false
      }
    }
  }

  private removeComponents = (entity: GameEntity) => {
    for (const component of entity.activeComponents) {
      if (isBehaviorComponent(component)) {
        const id = ComponentIds.get(component)
        this.components.delete(id)
        this.isSorted = false
      }
    }
  }
}
