import { GameEntity, GameQuery, GameSystem, GameWorld, GetComponent } from '@gglib/ecs'
import { SceneRootComponent } from '../components/SceneRootComponent'
import { TransformComponent } from '../components/TransformComponent'

export class SceneSystem extends GameSystem {
  protected world: GameWorld
  protected qSceneRoots: GameQuery

  public constructor(world: GameWorld) {
    super()
    this.world = world
    this.qSceneRoots = world.query({ scope: 'active', required: [SceneRootComponent] })
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
    const root = entity.component(SceneRootComponent, GetComponent.OptionalFollowParent)
    if (root && !entity.has(root.Tag)) {
      // prettier-ignore
      entity.addComponent(
        new root.Tag(),         // instance
        root.Tag,               // instance type
        SceneRootComponent.Tag, // alias type, so it can be found without knowing the instance type
      )
    }
  }

  private removeSceneTag = (entity: GameEntity) => {
    entity.removeComponentByType(SceneRootComponent.Tag)
  }
}
