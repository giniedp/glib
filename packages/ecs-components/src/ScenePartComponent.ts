import { Component, Entity, Inject } from '@gglib/ecs'
import { BoundingFrustum } from '@gglib/math'
import { LightSourceData, Scene, SceneItem } from '@gglib/render'
import { Immutable } from '@gglib/utils'

/**
 * @public
 */
 export interface ScenePartCollector {
  readonly scene: Immutable<Scene>
  readonly frustum: Immutable<BoundingFrustum>
  addItem(item: SceneItem): void
  addLight(light: LightSourceData): void
}

/**
 * A component where others can register if they have something to contribute to scene rendering
 *
 * @public
 * @remarks
 * Its likely for an entity to have multiple components that need to contribute to the
 * scene rendering. This component is a link between the rendering system and
 * the renderable components of an entity.
 */
@Component()
export class ScenePartComponent {
  public static readonly EVENT_COLLECT = 'ScenePartCollect'

  public readonly name = 'ScenePart'

  @Inject(Entity)
  public readonly entity: Entity

  /**
   * Collects scenery items from all registered contributors
   *
   * @param scenery - the scenery collector
   */
  public collect(scenery: ScenePartCollector) {
    this.entity.trigger(ScenePartComponent.EVENT_COLLECT, scenery)
  }
}
