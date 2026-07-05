import { type GameComponent, GameEntity, GetComponent, InitializableComponent } from '@gglib/ecs'
import { Mesh } from '@gglib/graphics'
import { BoundsComponent } from './BoundsComponent'

export interface MeshComponentOptions<MESH extends Mesh = Mesh> {
  mesh?: MESH
}

/**
 * @public
 */
export class MeshComponent<MESH extends Mesh = Mesh> implements GameComponent, InitializableComponent {
  /**
   * The entity that owns this component
   */
  public readonly entity: GameEntity

  /**
   * Gets and sets the mesh to render
   */
  public get mesh(): MESH {
    return this.value
  }
  public set mesh(value: MESH) {
    this.value = value
    this.handleMeshChanged()
  }

  public version: number = 0
  protected value: MESH
  protected bounds: BoundsComponent

  public constructor(options?: MeshComponentOptions<MESH>) {
    if (options?.mesh) {
      this.mesh = options.mesh
    }
  }

  public initialize(): void {
    this.bounds = this.entity.component(BoundsComponent, GetComponent.Optional)
    this.handleMeshChanged()
  }

  public destroy(): void {
    //
  }

  private handleMeshChanged() {
    this.version++
    if (!this.bounds) {
      // not initialized yet, or does not have a bounds component
      return
    }
    const mesh = this.value
    this.bounds.setLocalBounds(mesh?.boundingSphere, mesh?.boundingBox)
  }
}
