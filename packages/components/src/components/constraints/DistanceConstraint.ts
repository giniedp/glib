import { GameComponent, GameEntity } from '@gglib/ecs'
import { Vec3 } from '@gglib/math'
import { GameLoop } from '../../systems/GameLoop'
import { TransformComponent } from '../TransformComponent'

let v0: Vec3
let v1: Vec3

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
export class DistanceConstraint implements GameComponent {
  /**
   * The transform to follow
   */
  public source: TransformComponent
  /**
   * The transform to manipulate
   */
  public get target() {
    return this.entity.transform
  }
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

  public entity: GameEntity<TransformComponent>
  private loop: GameLoop

  public constructor(options: DistanceConstraintOptions = {}) {
    this.setup(options)
  }

  public setup(options: DistanceConstraintOptions) {
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

    let s = (v0 = v0 || Vec3.create())
    let t = (v1 = v1 || Vec3.create())

    s.initFrom(this.source.translation)
    if (this.source.parent && this.sourceSpace === 'world') {
      s.transformByMat4(this.source.parent.worldInverse)
    }

    t.initFrom(this.target.translation)
    if (this.target.parent && this.targetSpace === 'world') {
      t.transformByMat4(this.target.parent.worldInverse)
    }

    // calculate distance between objects
    let d = Vec3.distance(t, s)

    if (d < this.minDistance) {
      d = d + (this.minDistance - d) * this.weight
    }
    if (d > this.maxDistance) {
      d = d + (this.maxDistance - d) * this.weight
    }
    if (Math.abs(d) >= Number.EPSILON) {
      t.subtract(s).normalize().multiplyScalar(d).add(s)
    } else {
      t.initFrom(s)
    }

    if (this.target.parent && this.targetSpace === 'world') {
      t.transformByMat4(this.target.parent.world)
    }

    if (!t.equals(this.target.translation)) {
      this.target.setPositionV(t)
      if (this.commit) {
        this.target.updateIfNeeded()
      }
    }
  }
}
