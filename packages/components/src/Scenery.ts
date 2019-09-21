import { BoundingFrustum } from '@gglib/math'
import { LightSourceData, Scene, SceneItem } from '@gglib/render'
import { Immutable } from '@gglib/utils'

/**
 * @public
 */
export interface SceneryCollector {
  readonly scene: Immutable<Scene>
  readonly frustum: Immutable<BoundingFrustum>
  addItem(item: SceneItem): void
  addLight(light: LightSourceData): void
}

/**
 * @public
 */
export interface SceneryCollectable {
  collectScenery(collector: SceneryCollector): void
}
