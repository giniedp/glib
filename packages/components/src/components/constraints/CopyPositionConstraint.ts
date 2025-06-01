import { GameComponent, GameEntity } from '@gglib/ecs'
import { Vec3 } from '@gglib/math'
import { GameLoop } from '../../systems/GameLoop'
import { TransformComponent } from '../TransformComponent'

let p0: Vec3
let p1: Vec3

/**
 * Options for the {@link CopyPositionConstraint}
 *
 * @public
 */
export interface CopyPositionOptions {
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
export class CopyPositionConstraint implements GameComponent {
  public get target() {
    return this.entity.transform
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
  public entity: GameEntity<TransformComponent>
  private loop: GameLoop

  public constructor(options: CopyPositionOptions) {
    this.setup(options)
  }

  public setup(options: CopyPositionOptions) {
    if (options) {
      this.source = options.source ?? this.source
      this.weight = options.weight ?? this.weight
      this.commit = options.commit ?? this.commit
      this.copyX = options.copyX ?? this.copyX
      this.copyY = options.copyY ?? this.copyY
      this.copyZ = options.copyZ ?? this.copyZ
      this.sourceSpace = options.sourceSpace ?? this.sourceSpace
      this.targetSpace = options.targetSpace ?? this.targetSpace
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
    if (!this.source || !this.target || this.weight <= 0) {
      return
    }

    const source = (p0 = p0 || Vec3.create()).initFrom(this.source.translation)
    const target = (p1 = p1 || Vec3.create()).initFrom(this.target.translation)

    if (this.sourceSpace === 'world' && this.source.parent) {
      source.transformByMat4(this.source.parent.world)
    }

    if (this.targetSpace === 'world' && this.target.parent) {
      target.transformByMat4(this.target.parent.world)
    }

    Vec3.lerp(target, source, this.weight, source)

    if (this.targetSpace === 'world' && this.target.parent) {
      source.transformByMat4(this.target.parent.worldInverse)
    }

    if (!this.copyX) {
      source.x = this.target.translation.x
    }

    if (!this.copyY) {
      source.y = this.target.translation.y
    }
    if (!this.copyZ) {
      source.z = this.target.translation.z
    }
    if (!source.equals(this.target.translation)) {
      this.target.setPositionV(source)
      if (this.commit) {
        this.target.updateIfNeeded()
      }
    }
  }
}
