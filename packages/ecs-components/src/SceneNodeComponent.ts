import { Component, Entity, Inject } from '@gglib/ecs'
import { BoundingFrustum } from '@gglib/math'
import { LightSourceData, Scene, SceneItem } from '@gglib/render'
import { Immutable } from '@gglib/utils'

/**
 * The minimal interface of a scene node visitor
 *
 * @public
 * @remarks
 * Allows to add items and lights to a scene. Provides access to
 * the scene object and current view frustum for potential frustum culling.
 */
 export interface SceneNodeVisitor {
  readonly scene: Immutable<Scene>
  readonly frustum: Immutable<BoundingFrustum>
  addItem(item: SceneItem): void
  addLight(light: LightSourceData): void
}

/**
 * A component that emits an event when a scene visitor is visiting the host entity
 *
 * @public
 */
@Component()
export class SceneNodeComponent {
  public static readonly ON_VISIT = 'SceneNodeVisit'

  public readonly name = 'SceneNode'

  @Inject(Entity)
  public readonly entity: Entity

  /**
   * Emits the `ON_VISIT` event on host entity
   */
  public visit(visitor: SceneNodeVisitor) {
    this.entity.trigger(SceneNodeComponent.ON_VISIT, visitor)
  }
}
