import { TransformComponent } from '../TransformComponent'
import { Vec3 } from '@gglib/math'
import { Inject, OnUpdate, Component } from '@gglib/ecs'

let tmp0: Vec3
let tmp1: Vec3

/**
 * @public
 */
@Component()
export class DistanceConstraint implements OnUpdate {
  /**
   * The transform to follow
   */
  public source: TransformComponent
  /**
   * The transform to manipulate
   */
  @Inject(TransformComponent)
  public target: TransformComponent
  /**
   * The dampening factor
   *
   * @remarks
   * Value of `0` will have no effect. Value of `1` will have an instant effect.
   */
  public weight: number = 1
  /**
   * The distance
   */
  public distance = 1

  public onUpdate() {
    if (!this.source || !this.target || this.weight <= 0) {
      return
    }

    let v0 = tmp0 || Vec3.create()
    let v1 = tmp1 || Vec3.create()

    // v0 = position of them in world space
    v0.initFrom(this.source.position)
    if (this.source.parent) {
      v0.transformByMat4(this.source.inverse)
    }

    // v1 = position of us in world space
    v1.initFrom(this.target.position)
    if (this.target.parent) {
      v1.transformByMat4(this.target.inverse)
    }

    // calculate distance between objects
    let d = Vec3.distance(v1, v0)
    d = d + (this.distance - d) * this.weight

    // v1 = new position in world space
    v1
      .subtract(v0)
      .normalize()
      .multiplyScalar(d)
      .add(v0)

    // to local space
    if (this.target.parent) {
      v1.transformByMat4(this.target.parent.world)
    }

    this.target.setPositionV(v1)
  }
}
