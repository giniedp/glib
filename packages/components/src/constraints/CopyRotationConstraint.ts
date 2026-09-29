import { type GameComponent, GameEntity } from '@gglib/ecs'
import { IVec4, quat$premultiply, quatSlerp, vec4, vec4$initFrom, vec4Equals } from '@gglib/math'
import { TransformComponent } from '../components/TransformComponent'
import type { BehaviorComponent } from '../systems/BehaviorSystem'

let p0: IVec4
let p1: IVec4

/**
 * Options for the {@link CopyRotationConstraint}
 *
 * @public
 */
export interface CopyRotationOptions {
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
   * The space in which the the transform is read from source
   */
  sourceSpace?: 'local' | 'world'
  /**
   * The space in which the the transform is written to target
   */
  targetSpace?: 'local' | 'world'
}

/**
 * Constraints the translation of a transform in local or global space
 * @public
 */
export class CopyRotationConstraint implements GameComponent, BehaviorComponent {
  /**
   * The transform to manipulate
   */
  public get target(): TransformComponent | null {
    return this.entity?.getTransform() || null
  }

  /**
   * The source transform to read from
   */
  public source: TransformComponent

  /**
   * The percentage that this constraint has on the object each frame
   */
  public weight: number = 1

  /**
   * If true, the transform world matrix is updated after constraint is applied
   */
  public commit: boolean

  /**
   * The space in which the the transform is read from source
   */
  public sourceSpace?: 'local' | 'world' = 'local'

  /**
   * The space in which the the transform is written to target
   */
  public targetSpace?: 'local' | 'world' = 'local'

  public readonly entity: GameEntity

  public constructor(options?: CopyRotationOptions) {
    this.configure(options)
  }

  public configure(options: CopyRotationOptions) {
    if (options) {
      this.source = options.source ?? this.source
      this.weight = options.weight ?? this.weight
      this.commit = options.commit ?? this.commit
      this.sourceSpace = options.sourceSpace ?? this.sourceSpace
      this.targetSpace = options.targetSpace ?? this.targetSpace
    }
  }

  public updateBehavior(): void {
    if (!this.source || !this.target || this.weight <= 0) {
      return
    }

    const source = vec4$initFrom((p0 = p0 || vec4()), this.source.rotation)
    const target = vec4$initFrom((p1 = p1 || vec4()), this.target.rotation)

    if (this.sourceSpace === 'world' && this.source.parent) {
      quat$premultiply(source, this.source.parent.worldRotation)
    }

    if (this.targetSpace === 'world' && this.target.parent) {
      quat$premultiply(target, this.target.parent.worldRotation)
    }

    quatSlerp(target, source, this.weight, source)

    if (this.targetSpace === 'world' && this.target.parent) {
      quat$premultiply(source, this.target.parent.worldRotationInverse)
    }

    if (!vec4Equals(source, this.target.rotation)) {
      this.target.setRotation(source)
      if (this.commit) {
        this.target.updateIfNeeded()
      }
    }
  }
}
