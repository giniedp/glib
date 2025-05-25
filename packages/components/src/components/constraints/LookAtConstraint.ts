import { GameComponent, GameEntity } from '@gglib/ecs'
import { IVec3, Vec3, clamp } from '@gglib/math'
import { GameLoop } from '../../systems/GameLoop'
import { TransformComponent } from '../TransformComponent'

let tmp0: Vec3
let tmp1: Vec3
let tmp2: Vec3

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
  up?: IVec3
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
   * The transform to look at
   */
  public source: TransformComponent
  /**
   * The transform to manipulate
   */
  public get target() {
    return this.entity.transform
  }

  /**
   * The up vector
   */
  public up: IVec3 = Vec3.Up
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

  public entity: GameEntity<TransformComponent>

  private loop: GameLoop
  public constructor(options: LookAtConstraintOptions) {
    this.setup(options)
  }

  public setup(options: LookAtConstraintOptions) {
    if (options) {
      this.up = options?.up ?? this.up
      this.source = options?.source ?? this.source
      this.weight = options?.weight ?? this.weight
      this.commit = options?.commit ?? this.commit
      this.sourceSpace = options?.sourceSpace ?? this.sourceSpace
      this.targetSpace = options?.targetSpace ?? this.targetSpace
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

    let v0 = (tmp0 = tmp0 || Vec3.create())
    let v1 = (tmp1 = tmp1 || Vec3.create())

    // v0 = position of them in world space
    v0.initFrom(this.source.position)
    if (this.source.parent && this.sourceSpace === 'world') {
      v0.transformByMat4(this.source.world)
    }

    // v1 = position of us in world space
    v1.initFrom(this.target.position)
    if (this.target.parent && this.targetSpace === 'world') {
      v1.transformByMat4(this.target.world)
    }

    if (this.weight < 1) {
      // d = squared distance between objects
      const d = Vec3.distanceSquared(v1, v0)
      // v2 = current lookAt point at same distance
      let v2 = tmp2 || Vec3.create()
      this.target.world.getForward(v2)
      v2.multiplyScalar(d)
      v2.add(v1)
      // v1 = new lookAt point
      Vec3.lerp(v2, v0, clamp(this.weight, 0, 1), v0)
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
