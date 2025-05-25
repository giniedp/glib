import { GameComponent, GameEntity } from '@gglib/ecs'
import { Model } from '@gglib/graphics'
import { DrawableInfo } from '@gglib/render'
import { CollectEvent, RenderQuery } from '../systems/RenderSystem'
import { BoundingVolumeComponent } from './BoundingVolumeComponent'
import { TransformComponent } from './TransformComponent'

/**
 * A component that knows how to render a model
 *
 * @public
 */

export class ModelComponent implements GameComponent {
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
  public volume: BoundingVolumeComponent

  /**
   * The transform component of the entity
   */
  public get transform(): TransformComponent {
    return this.entity.transform
  }

  private _model: Model
  private _drawables: DrawableInfo[] = []

  public entity: GameEntity<TransformComponent>
  public initialize(entity: GameEntity<TransformComponent>): void {
    this.entity = entity
    this.volume = entity.component(BoundingVolumeComponent, true)
  }

  public activate(): void {
    RenderQuery.addCollectListener(this.entity, this.collect)
  }

  public deactivate(): void {
    RenderQuery.removeCollectListener(this.entity, this.collect)
  }

  public destroy(): void {
    //
  }

  public collect = (event: CollectEvent) => {
    for (let i = 0; i < this._drawables.length; i++) {
      event.addItem(this._drawables[i])
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
            item: null,
            material: null,
            transform: null,
          }
        }
        // TODO: get bone transform
        this._drawables[index].item = part
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
