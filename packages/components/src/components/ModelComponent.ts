import { type GameComponent, GameEntity, GetComponent, InitializableComponent } from '@gglib/ecs'
import { Model, type ModelLod } from '@gglib/model'
import { BoundsComponent } from './BoundsComponent'
import { InstanceDataComponent } from './InstanceDataComponent'

export interface ModelComponentOptions {
  model?: Model
}

/**
 * @public
 */
export class ModelComponent implements GameComponent, InitializableComponent {
  /**
   * The entity that owns this component
   */
  public readonly entity: GameEntity

  /**
   * Gets and sets the mesh to render
   */
  public get model(): Model {
    return this.value
  }
  public set model(value: Model) {
    this.value = value
    this.handleMeshChanged()
  }

  /**
   * Per instance data that is passed to the render items of the model.
   */
  public get instanceData(): Float32Array<ArrayBuffer> | null {
    return this.instance?.data
  }

  /**
   * The level of detail selected by distance, see {@link ModelLod.select}
   */
  public lodSelected: number = 0

  /**
   * The level of detail that is rendered, may be finer than {@link lodSelected} while that level is loading
   */
  public lodRendered: number = 0

  public version: number = 0
  protected value: Model
  protected bounds: BoundsComponent
  protected instance: InstanceDataComponent

  public constructor(options?: ModelComponentOptions) {
    this.model = options?.model
  }

  public initialize(): void {
    this.bounds = this.entity.component(BoundsComponent, GetComponent.Optional)
    this.instance = this.entity.component(InstanceDataComponent, GetComponent.Optional)
    this.handleMeshChanged()
  }

  public destroy(): void {
    //
  }

  private handleMeshChanged() {
    this.version++
    this.lodSelected = 0
    this.lodRendered = 0
    if (!this.bounds) {
      // not initialized yet, or does not have a bounds component
      return
    }
    const model = this.value
    this.bounds.setLocalBounds(model?.boundingSphere, model?.boundingBox)
  }
}
