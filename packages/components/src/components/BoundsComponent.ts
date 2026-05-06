import { type GameComponent, GameEntity } from '@gglib/ecs'
import { BoundingBox, BoundingSphere } from '@gglib/math'

export type Bounds = {
  box?: BoundingBox
  sphere?: BoundingSphere
}

export class BoundsComponent implements GameComponent {
  /**
   * The entity that owns this component
   */
  public readonly entity: GameEntity

  /**
   * The local bounding volumes of the entity
   */
  public readonly local: Bounds = {
    box: null,
    sphere: null,
  }

  /**
   * The world bounding volumes of the entity, updated by the BoundsUpdateSystem
   */
  public readonly world: Bounds = {
    box: null,
    sphere: null,
  }

  public version: number = 0
  public transformVersion: number

  public setLocalBounds(sphere: BoundingSphere, box: BoundingBox) {
    this.local.sphere = sphere
    this.local.box = box
    this.transformVersion = null
  }
}
