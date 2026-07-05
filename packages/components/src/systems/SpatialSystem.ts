import { GameEntity, GameSystem, GameWorld, GetComponent } from '@gglib/ecs'
import { idMap } from '@gglib/utils'
import { SpatialComponent } from '../components/SpatialComponent'
import { SpatialRootComponent } from '../components/SpatialRootComponent'

export class SpatialSystem extends GameSystem {
  protected world: GameWorld
  protected dirtySet = idMap<number, SpatialComponent>()

  public override initialize(world: GameWorld): void {
    this.world = world
    this.world.eventBus.on(GameEntity.onActivating, this.addSpatialTag)
    this.world.eventBus.on(SpatialComponent.onDirty, this.onNodeDirty)
    this.world.eventBus.on(GameEntity.onDeactivated, this.removeSpatialTag)
  }

  public override destroy(): void {
    this.world.eventBus.off(GameEntity.onActivating, this.addSpatialTag)
    this.world.eventBus.off(SpatialComponent.onDirty, this.onNodeDirty)
    this.world.eventBus.off(GameEntity.onDeactivated, this.removeSpatialTag)
  }

  private addSpatialTag = (entity: GameEntity) => {
    if (!entity.has(SpatialComponent)) {
      return
    }

    const root = entity.component(SpatialRootComponent, GetComponent.OptionalFollowParent)
    if (root && !entity.has(root.Tag)) {
      // prettier-ignore
      entity.addComponent(
        new root.Tag(),           // instance
        root.Tag,                 // instance type
        SpatialRootComponent.Tag, // alias type, so it can be found without knowing the instance type
      )
    }
  }

  private removeSpatialTag = (entity: GameEntity) => {
    const component = entity.component(SpatialRootComponent.Tag, GetComponent.Optional)
    if (component) {
      entity.removeComponentByType(SpatialRootComponent.Tag)
    }
  }

  public override update(): void {
    for (const component of this.dirtySet.values) {
      component.updateFitting()
    }
    this.dirtySet.clear()
  }

  private onNodeDirty = (component: SpatialComponent) => {
    this.dirtySet.set(component.entity.refId, component)
  }
}
