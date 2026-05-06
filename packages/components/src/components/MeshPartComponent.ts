import { type GameComponent, GameEntity, GetComponent, InitializableComponent } from '@gglib/ecs'
import { Geometry, Material } from '@gglib/graphics'
import { BoundsComponent } from './BoundsComponent'
import { IVec4 } from '@gglib/math'

/**
 * @public
 */
export class MeshPartComponent implements GameComponent, InitializableComponent {
  /**
   * The entity that owns this component
   */
  public readonly entity: GameEntity

  /**
   * Gets and sets the mesh material
   */
  public material: Material

  /**
   * Gets and sets the mesh to render
   */
  public get mesh(): Geometry {
    return this.value
  }
  public set mesh(value: Geometry) {
    this.value = value
    this.handleMeshChanged()
  }

  public instanced: boolean

  public instanceData1: IVec4
  public instanceData2: IVec4

  protected value: Geometry
  protected bounds: BoundsComponent

  public initialize(): void {
    this.bounds = this.entity.component(BoundsComponent, GetComponent.Optional)
    this.handleMeshChanged()
  }

  public destroy(): void {
    //
  }

  private handleMeshChanged() {
    if (!this.bounds) {
      // not initialized yet, or does not have a bounds component
      return
    }
    const mesh = this.value
    this.bounds.setLocalBounds(mesh?.boundingSphere, mesh?.boundingBox)
  }
}
