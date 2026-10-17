import { type GameComponent, GameEntity, GetComponent, InitializableComponent } from '@gglib/ecs'
import { Mesh, ResourceOwnership, type Ownable } from '@gglib/graphics'
import { BoundsComponent } from './BoundsComponent'
import { InstanceDataComponent } from './InstanceDataComponent'

export interface MeshComponentOptions<MESH extends Mesh = Mesh> {
  mesh?: MESH
}

/**
 * @public
 *
 * @remarks
 * The component owns the mesh it holds. A replaced mesh is released, the mesh is released when the component is destroyed.
 */
export class MeshComponent<MESH extends Mesh = Mesh> implements GameComponent, InitializableComponent, Ownable {
  /**
   * The entity that owns this component
   */
  public readonly entity: GameEntity

  /**
   * The ownership state of this component, holds the mesh
   */
  public readonly ownership: ResourceOwnership = new ResourceOwnership(this)

  /**
   * Gets and sets the mesh to render
   */
  public get mesh(): MESH {
    return this.value
  }
  public set mesh(value: MESH) {
    const previous = this.value
    if (value) {
      this.ownership.adopt(value)
    }
    this.value = value
    if (previous && previous !== value) {
      this.ownership.drop(previous)
    }
    this.handleMeshChanged()
  }

  public version: number = 0
  protected value: MESH
  protected bounds: BoundsComponent
  protected instance: InstanceDataComponent

  /**
   * Per instance data that is passed to the render items of the model.
   */
  public get instanceData(): Float32Array<ArrayBuffer> | null {
    return this.instance?.data
  }

  public constructor(options?: MeshComponentOptions<MESH>) {
    this.mesh = options?.mesh
  }

  public initialize(): void {
    this.bounds = this.entity.component(BoundsComponent, GetComponent.Optional)
    this.instance = this.entity.component(InstanceDataComponent, GetComponent.Optional)
    this.handleMeshChanged()
  }

  public destroy(): void {
    this.ownership.finalize()
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
