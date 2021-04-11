import { Inject, OnUpdate, OnSetup, Component } from '@gglib/ecs'
import { TransformComponent } from '../TransformComponent'
import { IVec3, Vec3, lerp } from '@gglib/math'
import { getOption } from '@gglib/utils'

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
@Component()
export class LimitPositionConstraint implements OnUpdate, OnSetup<LimitPositionOptions> {
  /**
   * The transform to manipulate
   */
  @Inject(TransformComponent)
  public target: TransformComponent
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

  public onUpdate() {
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
      position.x = this.limitX && (position.x < min.x) ? lerp(position.x, min.x, this.weight) : position.x
      position.y = this.limitY && (position.y < min.y) ? lerp(position.y, min.y, this.weight) : position.y
      position.z = this.limitZ && (position.z < min.z) ? lerp(position.z, min.z, this.weight) : position.z
    }
    if (max) {
      position.x = this.limitX && (position.x > max.x) ? lerp(position.x, max.x, this.weight) : position.x
      position.y = this.limitY && (position.y > max.y) ? lerp(position.y, max.y, this.weight) : position.y
      position.z = this.limitZ && (position.z > max.z) ? lerp(position.z, max.z, this.weight) : position.z
    }

    if (useWorldspace) {
      position.transformByMat4(this.target.parent.worldInverse)
    }

    if (!position.equals(this.target.position)) {
      this.target.setPositionV(position)
      if (this.commit) {
        this.target.onUpdate()
      }
    }
  }

  public onSetup(options: LimitPositionOptions) {
    this.weight = getOption(options, 'weight', this.weight)
    this.limitX = getOption(options, 'limitX', this.limitX)
    this.limitY = getOption(options, 'limitY', this.limitY)
    this.limitZ = getOption(options, 'limitZ', this.limitZ)
    this.min = getOption(options, 'min', this.min)
    this.max = getOption(options, 'max', this.max)
    this.commit = getOption(options, 'commit', this.commit)
    this.space = getOption(options, 'space', this.space)
  }
}
