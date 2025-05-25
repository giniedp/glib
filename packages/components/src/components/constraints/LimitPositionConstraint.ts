import { GameComponent, GameEntity } from '@gglib/ecs'
import { IVec3, Vec3, lerp } from '@gglib/math'
import { GameLoop } from '../../systems/GameLoop'
import { TransformComponent } from '../TransformComponent'

let p0: Vec3

/**
 * Options for the {@link LimitTranslationConstraint}
 *
 * @public
 */
export interface LimitPositionOptions {
  /**
   * The source transform to copy from
   */
  source?: TransformComponent
  /**
   * The percentage that this constraint has on the object each frame
   */
  weight?: number
  /**
   * The minimum position value
   */
  min?: IVec3
  /**
   * The maximum position value
   */
  max?: IVec3

  /**
   * Whether x axis is constrained (default is true)
   */
  limitX?: boolean
  /**
   * Whether y axis is constrained (default is true)
   */
  limitY?: boolean
  /**
   * Whether z axis is constrained (default is true)
   */
  limitZ?: boolean

  /**
   * If true, the transform world matrix is updated after constraint is applied
   */
  commit?: boolean
  /**
   * Tha space in which this constraint operates
   */
  space?: 'local' | 'world'
}

/**
 * Constraints the translation of a transform in local or world space
 * @public
 */

export class LimitPositionConstraint implements GameComponent {
  /**
   * The transform to manipulate
   */
  public get target() {
    return this.entity.transform
  }

  /**
   * The percentage that this constraint has on the object each frame
   */
  public weight: number = 1

  /**
   * The minimum position value
   */
  public min: IVec3

  /**
   * The maximum position value
   */
  public max: IVec3

  /**
   * Whether x axis is constrained (default is true)
   */
  public limitX = true

  /**
   * Whether y axis is constrained (default is true)
   */
  public limitY = true

  /**
   * Whether z axis is constrained (default is true)
   */
  public limitZ = true

  /**
   * If true, the transform world matrix is updated after constraint is applied
   */
  public commit: boolean
  /**
   * Tha space in which this constraint operates
   */
  public space: 'local' | 'world' = 'local'

  public entity: GameEntity<TransformComponent>
  private loop: GameLoop

  public constructor(options: LimitPositionOptions = {}) {
    this.setup(options)
  }

  public setup(options: LimitPositionOptions) {
    if (options) {
      this.weight = options.weight ?? this.weight
      this.limitX = options.limitX ?? this.limitX
      this.limitY = options.limitY ?? this.limitY
      this.limitZ = options.limitZ ?? this.limitZ
      this.min = options.min ?? this.min
      this.max = options.max ?? this.max
      this.commit = options.commit ?? this.commit
      this.space = options.space ?? this.space
    }
  }

  public initialize(entity: GameEntity<TransformComponent>): void {
    this.entity = entity
    this.loop = entity.provider.get(GameLoop)
  }

  public activate(): void {
    this.loop.onUpdate.add(this.update)
  }

  public deactivate(): void {
    this.loop.onUpdate.remove(this.update)
  }

  public destroy(): void {
    //
  }

  public update = () => {
    if (!this.target || this.weight <= 0) {
      return
    }

    const position = (p0 = p0 || Vec3.create()).initFrom(this.target.position)
    const min = this.min
    const max = this.max
    const useWorldspace = this.space === 'world' && !!this.target.parent

    if (useWorldspace) {
      position.transformByMat4(this.target.parent.world)
    }

    if (min) {
      position.x = this.limitX && position.x < min.x ? lerp(position.x, min.x, this.weight) : position.x
      position.y = this.limitY && position.y < min.y ? lerp(position.y, min.y, this.weight) : position.y
      position.z = this.limitZ && position.z < min.z ? lerp(position.z, min.z, this.weight) : position.z
    }
    if (max) {
      position.x = this.limitX && position.x > max.x ? lerp(position.x, max.x, this.weight) : position.x
      position.y = this.limitY && position.y > max.y ? lerp(position.y, max.y, this.weight) : position.y
      position.z = this.limitZ && position.z > max.z ? lerp(position.z, max.z, this.weight) : position.z
    }

    if (useWorldspace) {
      position.transformByMat4(this.target.parent.worldInverse)
    }

    if (!position.equals(this.target.position)) {
      this.target.setPositionV(position)
      if (this.commit) {
        this.target.updateIfNeeded()
      }
    }
  }
}
