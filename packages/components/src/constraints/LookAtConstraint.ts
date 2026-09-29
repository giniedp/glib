import { type GameComponent, GameEntity } from '@gglib/ecs'
import {
  type IVec3,
  clamp,
  mat4GetForward,
  vec3,
  vec3$add,
  vec3$initFrom,
  vec3$multiplyScalar,
  vec3$applyMat4,
  vec3DistanceSquared,
  vec3Lerp,
} from '@gglib/math'
import { TransformComponent } from '../components/TransformComponent'

let tmp0: IVec3
let tmp1: IVec3
let tmp2: IVec3

/**
 * Options for the {@link LookAtConstraint}
 *
 * @public
 */
export interface LookAtConstraintOptions {
  /**
   * The source transform to copy from
   */
  source?: TransformComponent
  /**
   * The percentage that this constraint has on the object each frame
   */
  weight?: number
  /**
   * The up vector
   */
  up: Readonly<IVec3>
  /**
   * If true, the transform world matrix is updated after constraint is applied
   */
  commit?: boolean
  /**
   * The space in which the the transform is read from source
   */
  sourceSpace?: 'local' | 'world'
  /**
   * The space in which the the transform is written to target
   */
  targetSpace?: 'local' | 'world'
}

export class LookAtConstraint implements GameComponent {
  /**
   * The transform to manipulate
   */
  public get target(): TransformComponent | null {
    return this.entity?.getTransform() || null
  }

  /**
   * The transform to look at
   */
  public source: TransformComponent

  /**
   * The up vector
   */
  public up: IVec3
  /**
   *
   */
  public weight: number = 1
  /**
   * If true, the transform world matrix is updated after constraint is applied
   */
  public commit: boolean
  /**
   * The space in which the the transform is read from source
   */
  public sourceSpace: 'local' | 'world' = 'local'
  /**
   * The space in which the the transform is written to target
   */
  public targetSpace: 'local' | 'world' = 'local'

  public readonly entity: GameEntity

  public constructor(options: LookAtConstraintOptions) {
    this.setup(options)
  }

  public setup(options: LookAtConstraintOptions) {
    if (options) {
      this.up = options.up ?? this.up
      this.source = options?.source ?? this.source
      this.weight = options?.weight ?? this.weight
      this.commit = options?.commit ?? this.commit
      this.sourceSpace = options?.sourceSpace ?? this.sourceSpace
      this.targetSpace = options?.targetSpace ?? this.targetSpace
    }
  }

  public updateBehavior(): void {
    if (!this.source || !this.target || this.weight <= 0) {
      return
    }

    let v0 = (tmp0 = tmp0 || vec3())
    let v1 = (tmp1 = tmp1 || vec3())
    let v2 = (tmp2 = tmp2 || vec3())
    // v0 = position of them in world space
    vec3$initFrom(v0, this.source.translation)
    if (this.source.parent && this.sourceSpace === 'world') {
      vec3$applyMat4(v0, this.source.world)
    }

    // v1 = position of us in world space
    vec3$initFrom(v1, this.target.translation)
    if (this.target.parent && this.targetSpace === 'world') {
      vec3$applyMat4(v1, this.target.world)
    }

    if (this.weight < 1) {
      // d = squared distance between objects
      const d = vec3DistanceSquared(v1, v0)
      // v2 = current lookAt point at same distance

      mat4GetForward(this.target.world, v2)
      vec3$multiplyScalar(v2, d)
      vec3$add(v2, v1)
      // v1 = new lookAt point
      vec3Lerp(v2, v0, clamp(this.weight, 0, 1), v0)
    }

    // to local space
    // if (this.target.parent && this.targetSpace === 'world') {
    //   v0.transformByMat4(this.target.parent.worldInverse)
    // }

    this.target.lookAt(v0, this.up)
    if (this.commit) {
      this.target.updateIfNeeded()
    }
  }
}
