import { Inject, OnUpdate, OnSetup, Component } from '@gglib/ecs'
import { TransformComponent } from '../TransformComponent'
import { Mat4, Vec3 } from '@gglib/math'
import { getOption } from '@gglib/utils'

let p0: Vec3
let p1: Vec3

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
@Component()
export class CopyScaleConstraint implements OnUpdate, OnSetup<CopyScaleOptions> {
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

  public onUpdate() {
    if (!this.source || !this.target || this.weight <= 0) {
      return
    }

    const source = (p0 = p0 || Vec3.create()).initFrom(this.source.scale)
    const target = (p1 = p1 || Vec3.create()).initFrom(this.target.scale)

    if (this.sourceSpace === 'world' && this.source.parent) {
      this.source.parent.world.transformV3Normal(source, source)
    }

    if (this.targetSpace === 'world' && this.target.parent) {
      this.target.parent.world.transformV3Normal(target, target)
    }

    Vec3.lerp(target, source, this.weight, source)

    if (this.targetSpace === 'world' && this.target.parent) {
      this.target.parent.worldInverse.transformV3Normal(source, source)
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
    if (!source.equals(this.target.scale)) {
      this.target.setScaleV(source)
      if (this.commit) {
        this.target.onUpdate()
      }
    }
  }

  public onSetup(options: CopyScaleOptions) {
    this.source = getOption(options, 'source', this.source)
    this.weight = getOption(options, 'weight', this.weight)
    this.commit = getOption(options, 'commit', this.commit)
    this.copyX = getOption(options, 'copyX', this.copyX)
    this.copyY = getOption(options, 'copyY', this.copyY)
    this.copyZ = getOption(options, 'copyZ', this.copyZ)
    this.sourceSpace = getOption(options, 'sourceSpace', this.sourceSpace)
    this.targetSpace = getOption(options, 'targetSpace', this.targetSpace)
  }
}
