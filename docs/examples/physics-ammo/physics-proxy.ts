import { BehaviorComponent, TransformComponent } from '@gglib/components'
import { GameComponent, GameEntity } from '@gglib/ecs'
import { IVec3, IVec4, vec3, Vec3, Vec4 } from '@gglib/math'
import { brand, Brand } from '@gglib/utils'
import Ammo from 'ammojs-typed'
import { PhysicsWorld } from './physics-world'

export type PhysicsShape = Brand<number, 'shape'>
export const PhysicsShape = {
  Box: brand<PhysicsShape>(0),
  Sphere: brand<PhysicsShape>(1),
  Cylinder: brand<PhysicsShape>(2),
  Cone: brand<PhysicsShape>(3),
  Capsule: brand<PhysicsShape>(4),
}

export interface PhysicsProxyOptions {
  mass: number
  size: IVec3
  dynamic: boolean
  shape: PhysicsShape
}

export class PhysicsProxy implements GameComponent, BehaviorComponent {
  public physics!: PhysicsWorld

  public get transform() {
    return this.entity.getTransform<TransformComponent>()
  }

  private shape!: Ammo.btCollisionShape
  private body!: Ammo.btRigidBody
  private needsReset = false
  public mass!: number
  public size!: IVec3
  public dynamic!: boolean
  public shapeType!: PhysicsShape

  public constructor(options: PhysicsProxyOptions) {
    this.mass = options.mass ?? 0
    this.size = options.size ?? vec3(1)
    this.dynamic = !!options.dynamic
    this.shapeType = options.shape ?? PhysicsShape.Box
  }

  public entity!: GameEntity
  public initialize(): void {
    this.physics = this.entity.service(PhysicsWorld)

    const mass = this.mass
    const shape = createShape(this.shapeType, this.size)
    const localInertia = new Ammo.btVector3(0, 0, 0)

    if (this.dynamic) {
      shape.calculateLocalInertia(mass, localInertia)
    }

    const motionState = new Ammo.btDefaultMotionState()
    const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia)
    const body = new Ammo.btRigidBody(rbInfo)

    this.shape = shape
    this.body = body
    this.physics.world.addRigidBody(this.body)
    this.needsReset = true
  }

  public destroy(): void {
    if (this.body) {
      this.physics.world.removeRigidBody(this.body)
      Ammo.destroy(this.body)
      Ammo.destroy(this.shape)
      this.body = null!
      this.shape = null!
    }
  }

  public setTransform(position: IVec3, rotation: IVec4) {
    this.transform!.setPositionV(position)
    this.transform!.setRotation(rotation)
    this.needsReset = true
  }

  public updateBehavior() {
    if (this.body && this.needsReset) {
      this.needsReset = false

      const origin = this.body.getWorldTransform().getOrigin()
      const rotation = this.body.getWorldTransform().getRotation()

      this.transform?.updateIfNeeded()
      this.transform!.world.decompose(
        Vec3.$0, // scale
        Vec4.$0, // rotation
        Vec3.$1, // position
      )
      origin.setX(Vec3.$1.x)
      origin.setY(Vec3.$1.y)
      origin.setZ(Vec3.$1.z)

      rotation.setX(Vec4.$0.x)
      rotation.setY(Vec4.$0.y)
      rotation.setZ(Vec4.$0.z)
      rotation.setW(Vec4.$0.w)

      this.body.activate()
    }

    if (this.body && this.transform) {
      const t = this.body.getWorldTransform()
      const o = t.getOrigin()
      const r = t.getRotation()
      this.transform.rotation.init(r.x(), r.y(), r.z(), r.w())
      this.transform.translation.init(o.x(), o.y(), o.z())
      this.transform.markAsChanged()
    }
  }
}

function createShape(type: PhysicsShape, size: IVec3) {
  switch (type) {
    case PhysicsShape.Box: {
      return new Ammo.btBoxShape(new Ammo.btVector3(size.x / 2, size.y / 2, size.z / 2))
    }
    case PhysicsShape.Sphere: {
      return new Ammo.btSphereShape(size.x)
    }
    case PhysicsShape.Cylinder: {
      return new Ammo.btCylinderShape(new Ammo.btVector3(size.x / 2, size.y / 2, size.z / 2))
    }
    case PhysicsShape.Cone: {
      return new Ammo.btConeShape(size.x, size.y)
    }
    case PhysicsShape.Capsule: {
      return new Ammo.btCapsuleShape(size.x, size.y)
    }
  }
  return new Ammo.btEmptyShape()
}
