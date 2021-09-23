import { Inject, Component, Listener } from '@gglib/ecs'
import { SceneItemDrawable } from '@gglib/render'
import { BoundingVolumeComponent } from './BoundingVolumeComponent'
import { SceneNodeComponent, SceneNodeVisitor } from './SceneNodeComponent'
import { TransformComponent } from './TransformComponent'
import { ModelMesh } from '@gglib/graphics'

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
export class MeshComponent {
  public readonly name = 'Mesh'

  /**
   * Gets and seths the model to be rendered
   */
  public get mesh() {
    return this._mesh
  }
  public set mesh(value: ModelMesh) {
    if (this._mesh !== value) {
      this._mesh = value
      this.onMeshChanged()
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

  /**
   * The scenery link component of the entity
   */
  @Inject(SceneNodeComponent)
  public readonly link: SceneNodeComponent

  private _mesh: ModelMesh
  private _drawables: SceneItemDrawable[] = []

  @Listener(SceneNodeComponent.ON_VISIT)
  public collectParts(collector: SceneNodeVisitor) {
    for (let i = 0; i < this._drawables.length; i++) {
      collector.addItem(this._drawables[i])
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
        this._drawables[i].drawable = this._mesh.parts[i]
        this._drawables[i].material = this._mesh.getMaterial(this._mesh.parts[i].materialId)
        this._drawables[i].transform = this.transform.world
      } else {
        this._drawables[i] = {
          type: 'drawable',
          drawable: this._mesh.parts[i],
          material: this._mesh.getMaterial(this._mesh.parts[i].materialId),
          transform: this.transform.world,
        }
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
