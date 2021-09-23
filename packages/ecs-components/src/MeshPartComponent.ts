import { Inject, Component, Listener } from '@gglib/ecs'
import { Material, ModelMeshPart } from '@gglib/graphics'
import { SceneItemDrawable } from '@gglib/render'
import { BoundingVolumeComponent } from './BoundingVolumeComponent'
import { SceneNodeComponent, SceneNodeVisitor } from './SceneNodeComponent'
import { TransformComponent } from './TransformComponent'

/**
 * A component that knows how to render a mesh part
 *
 * @public
 * @remarks
 * __Optional Services__
 * - `BoundingVolumeComponent` in order to provide a spatial bounding for this entity
 *
 * __Required Services__
 * - `TransformComponent` in order to update the position of the mesh
 * - `SceneryLinkComponent` in order to contribute to the scene rendering
 */
@Component({
  install: [
    SceneNodeComponent,
    TransformComponent,
  ]
})
export class MeshPartComponent {
  /**
   * The name of this component (`Mesh`)
   */
  public readonly name = 'MeshPart'

  /**
   * Gets and sets the mesh
   */
  public get mesh() {
    return this.$mesh
  }
  public set mesh(value: ModelMeshPart) {
    if (this.$mesh !== value) {
      this.$mesh = value
      this.meshChanged = true
    }
  }

  /**
   * Gets and sets the mesh material
   */
  public get material() {
    return this.$material
  }
  public set material(value: Material) {
    if (this.$material !== value) {
      this.$material = value
      this.materialChanged = true
    }
  }

  /**
   * The transform component of the entity
   */
  @Inject(TransformComponent)
  public readonly transform: TransformComponent

  /**
   * The bounding volume component of the entity
   */
  @Inject(BoundingVolumeComponent, { optional: true })
  public readonly volume?: BoundingVolumeComponent

  private $mesh: ModelMeshPart
  private $material: Material
  private $drawable: SceneItemDrawable = {
    type: 'drawable',
    drawable: null,
    material: null,
    transform: null,
  }

  private meshChanged = true
  private materialChanged = true

  /**
   * Component life cycle method
   */
  public onUpdate() {
    if (this.meshChanged && this.volume && this.$mesh) {
      if (this.mesh) {
        const volume = this.$mesh.boundingSphere || this.$mesh.boundingBox
        if (!volume) {
          console.warn('mesh has no bounding volume and can not provide a volume to the BoundingVolume component', this)
        }
        this.volume.linkVolume(volume)
      } else {
        this.volume.linkVolume(null)
      }
    }

    if (this.meshChanged || this.materialChanged) {
      this.$drawable.material = this.$material
      this.$drawable.drawable = this.$mesh
      this.meshChanged = false
      this.materialChanged = false
    }

    if (!this.transform) {
      this.$drawable.transform = null
    } else {
      this.$drawable.transform = this.transform.world
    }
  }

  @Listener(SceneNodeComponent.ON_VISIT)
  public collectParts(collector: SceneNodeVisitor) {
    const drawable = this.$drawable
    if (drawable.material && drawable.drawable) {
      collector.addItem(drawable)
    }
  }
}
