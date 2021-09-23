import { Inject, Component, Listener } from '@gglib/ecs'
import { Model } from '@gglib/graphics'
import { SceneItemDrawable } from '@gglib/render'
import { BoundingVolumeComponent } from './BoundingVolumeComponent'
import { SceneNodeComponent, SceneNodeVisitor } from './SceneNodeComponent'
import { TransformComponent } from './TransformComponent'

/**
 * A component that knows how to render a model
 *
 * @public
 * @remarks
 * __Optional Services__
 * - `BoundingVolumeComponent` in order to provide a spatial bounding for this entity
 *
 * __Required Services__
 * - `TransformComponent` in order to update the position of the model
 * - `SceneryLinkComponent` in order to contribute to the scene rendering
 */
@Component({
  install: [
    SceneNodeComponent,
    TransformComponent,
  ]
})
export class ModelComponent {
  public readonly name = 'Model'

  /**
   * Gets and seths the model to be rendered
   */
  public get model() {
    return this._model
  }
  public set model(value: Model) {
    if (this._model !== value) {
      this._model = value
      this.onModelChanged()
    }
  }

  /**
   * The bounding volume component of the entity
   */
  @Inject(BoundingVolumeComponent, { optional: true })
  public readonly volume: BoundingVolumeComponent

  /**
   * The transform component of the entity
   */
  @Inject(TransformComponent)
  public readonly transform: TransformComponent

  private _model: Model
  private _drawables: SceneItemDrawable[] = []

  @Listener(SceneNodeComponent.ON_VISIT)
  public collectParts(collector: SceneNodeVisitor) {
    for (let i = 0; i < this._drawables.length; i++) {
      collector.addItem(this._drawables[i])
    }
  }

  private onModelChanged() {
    if (!this._model) {
      this._drawables.length = 0
      if (this.volume) {
        this.volume.linkVolume(null)
      }
      return
    }

    let index = 0
    for (let m = 0; m < this._model.meshes.length; m++) {
      const mesh = this._model.meshes[m]
      for (let p = 0; p < mesh.parts.length; p++) {
        const part = mesh.parts[p]
        if (!this._drawables[index]) {
          this._drawables[index] = {
            type: 'drawable',
            drawable: null,
            material: null,
            transform: null,
          }
        }
        // TODO: get bone transform
        this._drawables[index].drawable = part
        this._drawables[index].material = mesh.getMaterial(part.materialId)
        this._drawables[index].transform = this.transform.world
        index++
      }
    }
    this._drawables.length = index

    if (this.volume) {
      // TODO: merge bounding volumes of all meshes
      const mesh = this._model.meshes[0]
      const volume = mesh.boundingSphere || mesh.boundingBox
      if (!volume) {
        console.warn('model has no bounding volume and can not provide a volume to the BoundingVolume component', this)
      }
      this.volume.linkVolume(volume)
    }
  }
}
