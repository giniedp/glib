import { GameEntity, GameSystem, GameWorld, GetComponent } from '@gglib/ecs'
import { SceneRootComponent } from '../components/SceneRootComponent'

export class SceneSystem extends GameSystem {
  protected world: GameWorld

  public constructor(world: GameWorld) {
    super()
    this.world = world
  }

  public override initialize(): void {
    this.world.onEntityActivating.add(this.addSceneTag)
    this.world.onEntityDeactivated.add(this.removeSceneTag)
  }

  public override destroy(): void {
    this.world.onEntityActivating.remove(this.addSceneTag)
    this.world.onEntityDeactivated.remove(this.removeSceneTag)
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
