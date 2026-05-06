import { type GameComponent, GameEntity, GetComponent, InitializableComponent } from '@gglib/ecs'
import { Model } from '@gglib/model'
import { BoundsComponent } from './BoundsComponent'

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

  protected value: Model
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
    const model = this.value
    this.bounds.setLocalBounds(model?.boundingSphere, model?.boundingBox)
  }
}
