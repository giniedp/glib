import { Entity, Inject, OnInit, OnRemoved, Service } from '@gglib/ecs'
import { Material, ModelMesh } from '@gglib/graphics'
import { SceneItemDrawable } from '@gglib/render'
import { BoundingVolumeComponent } from './BoundingVolumeComponent'
import { SceneryCollectable, SceneryCollector } from './Scenery'
import { SceneryLinkComponent } from './SceneryLinkComponent'
import { TransformComponent } from './TransformComponent'

/**
 * A component that knows how to render a mesh
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
@Service()
export class MeshComponent implements SceneryCollectable, OnInit, OnRemoved {

  /**
   * The name of this component (`Mesh`)
   */
  public readonly name = 'Mesh'

  /**
   * Adds a {@link MeshComponent} to the entity if it does not exist
   *
   * @param entity - The entity
   */
  public static ensure(entity: Entity) {
    BoundingVolumeComponent.ensure(entity)
    SceneryLinkComponent.ensure(entity)
    TransformComponent.ensure(entity)
    if (!entity.getService(MeshComponent, null)) {
      entity.addComponent(new MeshComponent())
    }
  }

  /**
   * Gets and sets the mesh
   */
  public get mesh() {
    return this.$mesh
  }
  public set mesh(value: ModelMesh) {
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

  /**
   * The scenery link component of the entity
   */
  @Inject(SceneryLinkComponent)
  public readonly link: SceneryLinkComponent

  private $mesh: ModelMesh
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
  public onInit() {
    this.link.register(this)
  }

  /**
   * Component life cycle method
   */
  public onRemoved() {
    this.link.unregister(this)
  }

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

  /**
   * SceneryCollectable method
   */
  public collectScenery(scenery: SceneryCollector) {
    const drawable = this.$drawable
    if (drawable.material && drawable.drawable) {
      scenery.addItem(drawable)
    }
  }
}
