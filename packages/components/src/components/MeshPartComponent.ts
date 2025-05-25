import { GameComponent, GameEntity } from '@gglib/ecs'
import { Geometry, Material } from '@gglib/graphics'
import { DrawableInfo } from '@gglib/render'
import { CollectEvent, RenderQuery } from '../systems/RenderSystem'
import { BoundingVolumeComponent } from './BoundingVolumeComponent'
import { TransformComponent } from './TransformComponent'

/**
 * A component that knows how to render a mesh part
 */
export class MeshPartComponent implements GameComponent {
  /**
   * Gets and sets the mesh
   */
  public get mesh() {
    return this._mesh
  }
  public set mesh(value: Geometry) {
    if (this._mesh !== value) {
      this._mesh = value
      this.meshChanged = true
    }
  }

  /**
   * Gets and sets the mesh material
   */
  public get material() {
    return this._material
  }
  public set material(value: Material) {
    if (this._material !== value) {
      this._material = value
      this.materialChanged = true
    }
  }

  /**
   * The transform component of the entity
   */
  public get transform(): TransformComponent {
    return this.entity.transform
  }

  /**
   * The bounding volume component of the entity
   */
  public volume?: BoundingVolumeComponent

  private _mesh: Geometry
  private _material: Material
  private _drawable: DrawableInfo = {
    type: 'drawable',
    item: null,
    material: null,
    transform: null,
  }

  private meshChanged = true
  private materialChanged = true

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

  public update = () => {
    if (this.meshChanged && this.volume && this._mesh) {
      if (this.mesh) {
        const volume = this._mesh.boundingSphere || this._mesh.boundingBox
        if (!volume) {
          console.warn('mesh has no bounding volume and can not provide a volume to the BoundingVolume component', this)
        }
        this.volume.linkVolume(volume)
      } else {
        this.volume.linkVolume(null)
      }
    }

    if (this.meshChanged || this.materialChanged) {
      this._drawable.material = this._material
      this._drawable.item = this._mesh
      this.meshChanged = false
      this.materialChanged = false
    }

    if (!this.transform) {
      this._drawable.transform = null
    } else {
      this._drawable.transform = this.transform.world
    }
  }

  public collect = (collector: CollectEvent) => {
    const drawable = this._drawable
    if (drawable.material && drawable.item) {
      collector.addItem(drawable)
    }
  }
}
