import { GameEntity, GameSystem, GameWorld, GetComponent } from '@gglib/ecs'
import { idMap } from '@gglib/utils'
import { SpatialNodeComponent } from '../components/SpatialNodeComponent'
import { SpatialComponent } from '../components/SpatialComponent'

export class SpatialSystem extends GameSystem {
  protected world: GameWorld
  protected dirtySet = idMap<number, SpatialNodeComponent>()

  public override initialize(world: GameWorld): void {
    this.world = world
    this.world.eventBus.on(GameEntity.onActivating, this.addSpatialTag)
    this.world.eventBus.on(SpatialNodeComponent.onDirty, this.onNodeDirty)
    this.world.eventBus.on(GameEntity.onDeactivated, this.removeSpatialTag)
  }

  public override destroy(): void {
    this.world.eventBus.off(GameEntity.onActivating, this.addSpatialTag)
    this.world.eventBus.off(SpatialNodeComponent.onDirty, this.onNodeDirty)
    this.world.eventBus.off(GameEntity.onDeactivated, this.removeSpatialTag)
  }

  private addSpatialTag = (entity: GameEntity) => {
    if (!entity.has(SpatialNodeComponent)) {
      return
    }

    const spatial = entity.component(SpatialComponent, GetComponent.OptionalFollowParent)
    if (spatial && !entity.has(spatial.Member)) {
      // prettier-ignore
      entity.addComponent(
        new spatial.Member(),    // instance
        spatial.Member,          // instance type
        SpatialComponent.Member, // alias type, so it can be found without knowing the instance type
      )
    }
  }

  private removeSpatialTag = (entity: GameEntity) => {
    const component = entity.component(SpatialComponent.Member, GetComponent.Optional)
    if (component) {
      entity.removeComponentByType(SpatialComponent.Member)
    }
  }

  public override update(): void {
    for (const component of this.dirtySet.values) {
      component.updateFitting()
    }
    this.dirtySet.clear()
  }

  private onNodeDirty = (component: SpatialNodeComponent) => {
    this.dirtySet.set(component.entity.refId, component)
  }
}
