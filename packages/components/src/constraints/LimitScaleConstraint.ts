import { type GameComponent, GameEntity } from '@gglib/ecs'
import { type IVec3, Vec3, lerp } from '@gglib/math'
import { TransformComponent } from '../components/TransformComponent'
import type { BehaviorComponent } from '../systems/BehaviorSystem'

/**
 * Options for the {@link LimitScaleConstraint}
 *
 * @public
 */
export interface LimitScaleOptions {
  /**
   * The percentage that this constraint has on the object each frame
   */
  weight?: number
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
   * The minimum scale value
   */
  min?: IVec3
  /**
   * The maximum scale value
   */
  max?: IVec3
  /**
   * If true, the transform world matrix is updated after constraint is applied
   */
  commit?: boolean
}

/**
 * Constraints the scale of a transform in local space
 *
 * @public
 */
export class LimitScaleConstraint implements GameComponent, BehaviorComponent {
  /**
   * The transform to manipulate
   */
  public get target(): TransformComponent | null {
    return this.entity?.getTransform() || null
  }

  /**
   * The percentage that this constraint has on the object each frame
   */
  public weight: number = 1
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
   * The minimum scale value
   */
  public min: IVec3
  /**
   * The maximum scale value
   */
  public max: IVec3
  /**
   * If true, the transform world matrix is updated after constraint is applied
   */
  public commit: boolean
  /**
   * Tha space in which this constraint operates
   */
  public space: 'local' | 'world' = 'local'

  public readonly entity: GameEntity

  public constructor(options: LimitScaleOptions = {}) {
    this.configure(options)
  }

  public configure(options: LimitScaleOptions) {
    if (options) {
      this.weight = options.weight ?? this.weight
      this.limitX = options.limitX ?? this.limitX
      this.limitY = options.limitY ?? this.limitY
      this.limitZ = options.limitZ ?? this.limitZ
      this.min = options.min ?? this.min
      this.max = options.max ?? this.max
    }
  }

  public updateBehavior(): void {
    if (!this.target || this.weight <= 0) {
      return
    }

    const scale = Vec3.$0.initFrom(this.target.scale)
    const min = this.min
    const max = this.max
    const useWorldspace = this.space === 'world' && !!this.target.parent

    if (useWorldspace) {
      this.target.parent.world.transformV3Normal(scale, scale)
    }

    if (this.weight >= 1) {
      Vec3.clamp(scale, min || scale, max || scale)
    } else {
      if (min) {
        scale.x = this.limitX && scale.x < min.x ? lerp(scale.x, min.x, this.weight) : scale.x
        scale.y = this.limitY && scale.y < min.y ? lerp(scale.y, min.y, this.weight) : scale.y
        scale.z = this.limitZ && scale.z < min.z ? lerp(scale.z, min.z, this.weight) : scale.z
      }
      if (max) {
        scale.x = this.limitX && scale.x > max.x ? lerp(scale.x, max.x, this.weight) : scale.x
        scale.y = this.limitY && scale.y > max.y ? lerp(scale.y, max.y, this.weight) : scale.y
        scale.z = this.limitZ && scale.z > max.z ? lerp(scale.z, max.z, this.weight) : scale.z
      }
    }

    if (useWorldspace) {
      this.target.parent.worldInverse.transformV3Normal(scale, scale)
    }

    if (!scale.equals(this.target.scale)) {
      this.target.setScale(scale)
      if (this.commit) {
        this.target.updateIfNeeded()
      }
    }
  }
}
