import { GameSystem, GameWorld, SystemOrder } from '@gglib/ecs'
import { idMap } from '@gglib/utils'
import { BoundsComponent } from '../components'

export class BoundsUpdateSystem extends GameSystem {
  public override order: number = SystemOrder.Scene + 1

  private world: GameWorld
  protected dirtySet = idMap<number, BoundsComponent>()

  public initialize(world: GameWorld): void {
    this.world = world
    world.eventBus.on(BoundsComponent.onDirty, this.onBoundsDirty)
  }

  public destroy(): void {
    if (this.world) {
      this.world.eventBus.off(BoundsComponent.onDirty, this.onBoundsDirty)
    }
  }

  public override update(): void {
    for (const bounds of this.dirtySet.values) {
      bounds.updateWorldBounds()
    }
    this.dirtySet.clear()
  }

  private onBoundsDirty = (component: BoundsComponent) => {
    this.dirtySet.set(component.entity.refId, component)
  }
}
