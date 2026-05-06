import { type GameComponent, GameEntity, GetComponent, InitializableComponent } from '@gglib/ecs'
import { Mesh } from '@gglib/graphics'
import { BoundsComponent } from './BoundsComponent'

/**
 * @public
 */
export class MeshComponent implements GameComponent, InitializableComponent {
  /**
   * The entity that owns this component
   */
  public readonly entity: GameEntity

  /**
   * Gets and sets the mesh to render
   */
  public get mesh(): Mesh {
    return this.value
  }
  public set mesh(value: Mesh) {
    this.value = value
    this.handleMeshChanged()
  }

  protected value: Mesh
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
