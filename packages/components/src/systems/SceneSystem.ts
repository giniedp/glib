import { GameEntity, GameQuery, GameSystem, GameWorld, GetComponent } from '@gglib/ecs'
import { SceneComponent } from '../components/SceneComponent'
import { TransformComponent } from '../components/TransformComponent'

export class SceneSystem extends GameSystem {
  protected world: GameWorld
  protected qSceneRoots: GameQuery

  public constructor(world: GameWorld) {
    super()
    this.world = world
    this.qSceneRoots = world.query({ scope: 'active', required: [SceneComponent] })
  }

  public override initialize(): void {
    this.world.eventBus.on(GameEntity.onActivating, this.addSceneTag)
    this.world.eventBus.on(GameEntity.onDeactivated, this.removeSceneTag)
  }

  public override update(): void {
    for (const entity of this.qSceneRoots) {
      entity.getTransform<TransformComponent>().propagateUpdates(false, true)
    }
  }

  public override destroy(): void {
    this.world.eventBus.off(GameEntity.onActivating, this.addSceneTag)
    this.world.eventBus.off(GameEntity.onDeactivated, this.removeSceneTag)
  }

  private addSceneTag = (entity: GameEntity) => {
    const root = entity.component(SceneComponent, GetComponent.OptionalFollowParent)
    if (root && !entity.has(root.Member)) {
      // prettier-ignore
      entity.addComponent(
        new root.Member(),         // instance
        root.Member,               // instance type
        SceneComponent.Member, // alias type, so it can be found without knowing the instance type
      )
    }
  }

  private removeSceneTag = (entity: GameEntity) => {
    entity.removeComponentByType(SceneComponent.Member)
  }
}
