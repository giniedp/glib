import { BehaviorComponent } from '@gglib/components'
import { GameComponent, GameEntity, InitializableComponent } from '@gglib/ecs'
import { IVec3 } from '@gglib/math'
import Ammo from 'ammojs-typed'
import { PhysicsProxy } from './physics-proxy'
import { PhysicsWorld } from './physics-world'

/**
 * Connects the body of this entity with the body of another entity.
 *
 * @remarks
 * The constraint is created once both bodies exist and are placed
 */
abstract class JointComponent implements GameComponent, InitializableComponent, BehaviorComponent {
  public entity!: GameEntity
  private physics!: PhysicsWorld
  private self!: PhysicsProxy
  private constraint: Ammo.btTypedConstraint | null = null

  public constructor(protected other: PhysicsProxy) {}

  protected abstract create(self: Ammo.btRigidBody, other: Ammo.btRigidBody): Ammo.btTypedConstraint

  public initialize(): void {
    this.physics = this.entity.service(PhysicsWorld)
    this.self = this.entity.component(PhysicsProxy)
  }

  public updateBehavior(): void {
    if (this.constraint || !this.self.isReady || !this.other.isReady) {
      return
    }
    this.constraint = this.create(this.self.body, this.other.body)
    // linked bodies do not collide with each other
    this.physics.world.addConstraint(this.constraint, true)
  }

  public destroy(): void {
    if (this.constraint) {
      this.physics.world.removeConstraint(this.constraint)
      Ammo.destroy(this.constraint)
      this.constraint = null
    }
  }
}

/**
 * Rotates around one axis, like a door on its hinges
 */
export class HingeJoint extends JointComponent {
  public constructor(
    other: PhysicsProxy,
    private options: { pivot: IVec3; otherPivot: IVec3; axis: IVec3; limit: number },
  ) {
    super(other)
  }

  protected create(self: Ammo.btRigidBody, other: Ammo.btRigidBody) {
    const { pivot, otherPivot, axis, limit } = this.options
    const v = (it: IVec3) => new Ammo.btVector3(it.x, it.y, it.z)
    const hinge = new Ammo.btHingeConstraint(self, other, v(pivot), v(otherPivot), v(axis), v(axis))
    hinge.setLimit(-limit, limit, 0.9, 0.3, 1)
    return hinge
  }
}

/**
 * Keeps two points together and rotates freely, like the links of a chain
 */
export class PointJoint extends JointComponent {
  public constructor(
    other: PhysicsProxy,
    private options: { pivot: IVec3; otherPivot: IVec3 },
  ) {
    super(other)
  }

  protected create(self: Ammo.btRigidBody, other: Ammo.btRigidBody) {
    const { pivot, otherPivot } = this.options
    return new Ammo.btPoint2PointConstraint(
      self,
      other,
      new Ammo.btVector3(pivot.x, pivot.y, pivot.z),
      new Ammo.btVector3(otherPivot.x, otherPivot.y, otherPivot.z),
    )
  }
}
