import { TransformComponent } from '../TransformComponent'
import { Vec3, IVec3, clamp } from '@gglib/math'
import { Inject, OnUpdate, Component } from '@gglib/ecs'

let tmp0: Vec3
let tmp1: Vec3
let tmp2: Vec3

@Component()
export class LookAtConstraint implements OnUpdate {
  /**
   * The transform to look at
   */
  public source: TransformComponent
  /**
   * The transform to manipulate
   */
  @Inject(TransformComponent)
  public target: TransformComponent
  /**
   * The up vector
   */
  public up: IVec3 = Vec3.Up
  /**
   *
   */
  public weight: number = 1

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
    if (this.target.parent) {
      v0.transformByMat4(this.target.parent.world)
    }

    this.target.lookAt(v0, this.up)
  }
}
