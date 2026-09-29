import { type GameComponent, GameEntity } from '@gglib/ecs'
import { IVec3, vec3, vec3$applyMat4Rotation, vec3$initFrom, vec3Equals, vec3Lerp } from '@gglib/math'
import { TransformComponent } from '../components/TransformComponent'
import type { BehaviorComponent } from '../systems/BehaviorSystem'

let p0: IVec3
let p1: IVec3

/**
 * Options for the {@link CopyScaleConstraint}
 *
 * @public
 */
export interface CopyScaleOptions {
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
   * Whether x axis is copied (default is true)
   */
  copyX?: boolean
  /**
   * Whether y axis is copied (default is true)
   */
  copyY?: boolean
  /**
   * Whether z axis is copied (default is true)
   */
  copyZ?: boolean
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
export class CopyScaleConstraint implements GameComponent, BehaviorComponent {
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
   * Whether x axis is copied (default is true)
   */
  public copyX: boolean = true

  /**
   * Whether y axis is copied (default is true)
   */
  public copyY: boolean = true

  /**
   * Whether z axis is copied (default is true)
   */
  public copyZ: boolean = true

  /**
   * The space in which the the transform is read from source
   */
  public sourceSpace?: 'local' | 'world' = 'local'

  /**
   * The space in which the the transform is written to target
   */
  public targetSpace?: 'local' | 'world' = 'local'

  public readonly entity: GameEntity

  public constructor(options?: CopyScaleOptions) {
    this.configure(options)
  }

  public configure(options: CopyScaleOptions) {
    if (options) {
      this.source = options?.source ?? this.source
      this.weight = options?.weight ?? this.weight
      this.commit = options?.commit ?? this.commit
      this.copyX = options?.copyX ?? this.copyX
      this.copyY = options?.copyY ?? this.copyY
      this.copyZ = options?.copyZ ?? this.copyZ
      this.sourceSpace = options?.sourceSpace ?? this.sourceSpace
      this.targetSpace = options?.targetSpace ?? this.targetSpace
    }
  }

  public updateBehavior(): void {
    if (!this.source || !this.target || this.weight <= 0) {
      return
    }

    const source = (p0 = p0 || vec3())
    const target = (p1 = p1 || vec3())

    vec3$initFrom(source, this.source.scale)
    vec3$initFrom(target, this.target.scale)

    if (this.sourceSpace === 'world' && this.source.parent) {
      vec3$applyMat4Rotation(source, this.source.parent.world)
    }

    if (this.targetSpace === 'world' && this.target.parent) {
      vec3$applyMat4Rotation(target, this.target.parent.world)
    }

    vec3Lerp(target, source, this.weight, source)

    if (this.targetSpace === 'world' && this.target.parent) {
      vec3$applyMat4Rotation(source, this.target.parent.worldInverse)
    }

    if (!this.copyX) {
      source.x = this.target.scale.x
    }
    if (!this.copyY) {
      source.y = this.target.scale.y
    }
    if (!this.copyZ) {
      source.z = this.target.scale.z
    }
    if (!vec3Equals(source, this.target.scale)) {
      this.target.setScale(source)
      if (this.commit) {
        this.target.updateIfNeeded()
      }
    }
  }
}
