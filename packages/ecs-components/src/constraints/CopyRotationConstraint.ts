import { Component, Inject, OnSetup, OnUpdate } from '@gglib/ecs'
import { Quat } from '@gglib/math'
import { TransformComponent } from '../TransformComponent'

let p0: Quat
let p1: Quat

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
@Component()
export class CopyRotationConstraint implements OnUpdate, OnSetup<CopyRotationOptions> {
  /**
   * The source transform to read from
   */
  public source: TransformComponent

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

  public onUpdate() {
    if (!this.source || !this.target || this.weight <= 0) {
      return
    }

    const source = (p0 = p0 || Quat.create()).initFrom(this.source.rotation)
    const target = (p1 = p1 || Quat.create()).initFrom(this.target.rotation)

    if (this.sourceSpace === 'world' && this.source.parent) {
      source.preMultiply(this.source.parent.worldRotation)
    }

    if (this.targetSpace === 'world' && this.target.parent) {
      target.preMultiply(this.target.parent.worldRotation)
    }

    Quat.slerp(target, source, this.weight, source)

    if (this.targetSpace === 'world' && this.target.parent) {
      source.preMultiply(this.target.parent.worldRotationInverse)
    }

    if (!source.equals(this.target.rotation)) {
      this.target.setRotation(source)
      if (this.commit) {
        this.target.onUpdate()
      }
    }
  }

  public onSetup(options: CopyRotationOptions) {
    if (options) {
      this.source = options.source ?? this.source
      this.weight = options.weight ?? this.weight
      this.commit = options.commit ?? this.commit
      this.sourceSpace = options.sourceSpace ?? this.sourceSpace
      this.targetSpace = options.targetSpace ?? this.targetSpace
    }
  }
}
