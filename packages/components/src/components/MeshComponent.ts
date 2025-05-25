import { GameComponent, GameEntity } from '@gglib/ecs'
import { Mesh } from '@gglib/graphics'
import { DrawableInfo } from '@gglib/render'
import { GameTransform } from 'ecs/src/GameTransform'
import { CollectEvent, RenderQuery } from '../systems/RenderSystem'
import { BoundingVolumeComponent } from './BoundingVolumeComponent'

/**
 * A component that knows how to render a model
 */
export class MeshComponent implements GameComponent {
  /**
   * Gets and seths the model to be rendered
   */
  public get mesh() {
    return this._mesh
  }
  public set mesh(value: Mesh) {
    if (this._mesh !== value) {
      this._mesh = value
      this.onMeshChanged()
    }
  }

  /**
   * The bounding volume component of the entity
   */
  public volume: BoundingVolumeComponent

  /**
   * The transform component of the entity
   */
  public get transform() {
    return this.entity.transform
  }

  private _mesh: Mesh
  private _drawables: DrawableInfo[] = []

  public entity: GameEntity<GameTransform>

  public initialize(entity: GameEntity<GameTransform>): void {
    this.entity = entity
    this.volume = entity.component(BoundingVolumeComponent)
  }

  public activate(): void {
    RenderQuery.addCollectListener(this.entity, this.collectDrawables)
  }

  public deactivate(): void {
    RenderQuery.addCollectListener(this.entity, this.collectDrawables)
  }

  public destroy(): void {
    //
  }

  public collectDrawables = (e: CollectEvent) => {
    for (let i = 0; i < this._drawables.length; i++) {
      e.addItem(this._drawables[i])
    }
  }

  private onMeshChanged() {
    if (!this._mesh) {
      this._drawables.length = 0
      if (this.volume) {
        this.volume.linkVolume(null)
      }
      return
    }

    this._drawables.length = this._mesh.parts.length
    for (let i = 0; i < this._drawables.length; i++) {
      if (this._drawables[i]) {
        this._drawables[i].item = this._mesh.parts[i]
        this._drawables[i].material = this._mesh.getMaterial(this._mesh.parts[i].materialId)
        this._drawables[i].transform = this.transform.world
      } else {
        this._drawables[i] = {
          type: 'drawable',
          item: this._mesh.parts[i],
          material: this._mesh.getMaterial(this._mesh.parts[i].materialId),
          transform: this.transform.world,
        } satisfies DrawableInfo
      }
    }
    if (this.volume) {
      const volume = this._mesh.boundingSphere || this._mesh.boundingBox
      if (!volume) {
        console.warn('mesh has no bounding volume and can not provide a volume to the BoundingVolume component', this)
      }
      this.volume.linkVolume(volume)
    }
  }
}
