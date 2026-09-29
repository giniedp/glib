import { type GameComponent, GameEntity } from '@gglib/ecs'
import {
  IVec3,
  vec3,
  vec3$initFrom,
  vec3$normalize,
  vec3$subtract,
  vec3$applyMat4,
  vec3Distance,
  vec3Equals,
} from '@gglib/math'
import { TransformComponent } from '../components/TransformComponent'
import type { BehaviorComponent } from '../systems/BehaviorSystem'

let v0: IVec3
let v1: IVec3

/**
 * Options for the {@link DistanceConstraint}
 *
 * @public
 */
export interface DistanceConstraintOptions {
  /**
   * The source transform to copy from
   */
  source?: TransformComponent
  /**
   * The percentage that this constraint has on the object each frame
   */
  weight?: number
  /**
   * If true, the transform world matrix is updated after constraint is applied
   */
  commit?: boolean
  /**
   * The minimum distance
   */
  minDistance?: number
  /**
   * The maximum distance
   */
  maxDistance?: number
  /**
   * The space in which the the transform is read from source
   */
  sourceSpace?: 'local' | 'world'
  /**
   * The space in which the the transform is written to target
   */
  targetSpace?: 'local' | 'world'
}

/**
 * @public
 */
export class DistanceConstraint implements GameComponent, BehaviorComponent {
  /**
   * The transform to manipulate
   */
  public get target(): TransformComponent | null {
    return this.entity?.getTransform() || null
  }

  /**
   * The transform to follow
   */
  public source: TransformComponent

  /**
   * The dampening factor
   *
   * @remarks
   * Value of `0` will have no effect. Value of `1` will have an instant effect.
   */
  public weight: number = 1
  /**
   * The minimum distance (defaults to 0)
   */
  public minDistance = 0
  /**
   * The maximum distance (defaults to 1)
   */
  public maxDistance = 1
  /**
   * If true, the transform world matrix is updated after constraint is applied
   */
  public commit: boolean
  /**
   * The space in which the the transform is read from source
   */
  public sourceSpace: 'local' | 'world'
  /**
   * The space in which the the transform is written to target
   */
  public targetSpace: 'local' | 'world'

  public readonly entity: GameEntity

  public constructor(options: DistanceConstraintOptions = {}) {
    this.config(options)
  }

  public config(options: DistanceConstraintOptions) {
    if (options) {
      this.source = options.source ?? this.source
      this.weight = options.weight ?? this.weight
      this.commit = options.commit ?? this.commit
      this.sourceSpace = options.sourceSpace ?? this.sourceSpace
      this.targetSpace = options.targetSpace ?? this.targetSpace
      this.minDistance = options.minDistance ?? this.minDistance
      this.maxDistance = options.maxDistance ?? this.maxDistance
    }
  }

  public updateBehavior(): void {
    if (!this.source || !this.target || this.weight <= 0) {
      return
    }

    let s = (v0 = v0 || vec3())
    let t = (v1 = v1 || vec3())

    vec3$initFrom(s, this.source.translation)
    if (this.source.parent && this.sourceSpace === 'world') {
      vec3$applyMat4(s, this.source.parent.worldInverse)
    }

    vec3$initFrom(t, this.target.translation)
    if (this.target.parent && this.targetSpace === 'world') {
      vec3$applyMat4(t, this.target.parent.worldInverse)
    }

    // calculate distance between objects
    let d = vec3Distance(t, s)

    if (d < this.minDistance) {
      d = d + (this.minDistance - d) * this.weight
    }
    if (d > this.maxDistance) {
      d = d + (this.maxDistance - d) * this.weight
    }
    if (Math.abs(d) >= Number.EPSILON) {
      vec3$subtract(t, s)
      vec3$normalize(t)
      t.x = t.x * d + s.x
      t.y = t.y * d + s.y
      t.z = t.z * d + s.z
    } else {
      vec3$initFrom(t, s)
    }

    if (this.target.parent && this.targetSpace === 'world') {
      vec3$applyMat4(t, this.target.parent.world)
    }

    if (!vec3Equals(t, this.target.translation)) {
      this.target.setPositionV(t)
      if (this.commit) {
        this.target.updateIfNeeded()
      }
    }
  }
}
