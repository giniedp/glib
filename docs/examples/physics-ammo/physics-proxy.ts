import { BehaviorComponent, TransformComponent } from '@gglib/components'
import { GameComponent, GameEntity } from '@gglib/ecs'
import { IVec3, IVec4, mat4Decompose, vec3, vec3$init, vec3$initFrom, vec4, vec4$init } from '@gglib/math'
import { brand, Brand } from '@gglib/utils'
import Ammo from 'ammojs-typed'
import { PhysicsWorld } from './physics-world'

export type PhysicsShape = Brand<number, 'shape'>
export const PhysicsShape = {
  Box: brand<PhysicsShape>(0),
  Sphere: brand<PhysicsShape>(1),
  Cylinder: brand<PhysicsShape>(2),
  Cone: brand<PhysicsShape>(3),
}

export interface PhysicsProxyOptions {
  mass: number
  size: IVec3
  dynamic: boolean
  shape: PhysicsShape
  // Enables continuous collision detection, so fast bodies do not pass through others
  ccd?: boolean
}

export class PhysicsProxy implements GameComponent, BehaviorComponent {
  public physics!: PhysicsWorld
  public transform!: TransformComponent

  /**
   * The rigid body, `null` until the component is initialized
   */
  public get body() {
    return this.rigidBody
  }

  /**
   * Whether the body exists and is at the position of the entity
   */
  public get isReady() {
    return !!this.rigidBody && !this.needsReset
  }

  private shape!: Ammo.btCollisionShape
  private rigidBody: Ammo.btRigidBody = null!
  private needsReset = false
  private velocity = vec3()
  private temp: Ammo.btVector3 | null = null
  public mass!: number
  public size!: IVec3
  public dynamic!: boolean
  public ccd!: boolean
  public shapeType!: PhysicsShape

  public constructor(options: PhysicsProxyOptions) {
    this.mass = options.mass ?? 0
    this.size = options.size ?? vec3(1)
    this.dynamic = !!options.dynamic
    this.ccd = !!options.ccd
    this.shapeType = options.shape ?? PhysicsShape.Box
  }

  public entity!: GameEntity
  public initialize(): void {
    this.physics = this.entity.service(PhysicsWorld)
    this.transform = this.entity.$(TransformComponent)

    const mass = this.mass
    const shape = createShape(this.shapeType, this.size)
    const localInertia = new Ammo.btVector3(0, 0, 0)

    if (this.dynamic) {
      shape.calculateLocalInertia(mass, localInertia)
    }

    const motionState = new Ammo.btDefaultMotionState()
    const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia)
    const body = new Ammo.btRigidBody(rbInfo)
    Ammo.destroy(rbInfo)
    Ammo.destroy(localInertia)
    if (this.ccd) {
      const radius = Math.min(this.size.x, this.size.y, this.size.z) / 2
      body.setCcdMotionThreshold(radius)
      body.setCcdSweptSphereRadius(radius * 0.8)
    }

    this.shape = shape
    this.rigidBody = body
    this.physics.world.addRigidBody(this.rigidBody)
    this.needsReset = true
  }

  public destroy(): void {
    if (this.rigidBody) {
      this.physics.world.removeRigidBody(this.rigidBody)
      Ammo.destroy(this.rigidBody)
      Ammo.destroy(this.shape)
      if (this.temp) {
        Ammo.destroy(this.temp)
      }
      this.rigidBody = null!
      this.shape = null!
    }
  }

  /**
   * Moves the body to the given position and rotation and stops it
   */
  public setTransform(position: IVec3, rotation: IVec4) {
    this.launch(position, rotation, ZERO)
  }

  /**
   * Moves the body to the given position and rotation and gives it a velocity
   */
  public launch(position: IVec3, rotation: IVec4, velocity: IVec3) {
    // may be called before initialize
    const transform = this.transform ?? this.entity.getTransform<TransformComponent>()
    transform.setPositionV(position)
    transform.setRotation(rotation)
    vec3$initFrom(this.velocity, velocity)
    this.needsReset = true
  }

  public updateBehavior() {
    const body = this.rigidBody
    if (body && this.needsReset) {
      this.needsReset = false

      const origin = body.getWorldTransform().getOrigin()
      const rotation = body.getWorldTransform().getRotation()

      this.transform.updateIfNeeded()
      mat4Decompose(
        this.transform.world,
        vec3.$0, // scale
        vec4.$0, // rotation
        vec3.$1, // position
      )
      origin.setValue(vec3.$1.x, vec3.$1.y, vec3.$1.z)
      // getRotation returns a copy, it must be written back
      rotation.setValue(vec4.$0.x, vec4.$0.y, vec4.$0.z, vec4.$0.w)
      body.getWorldTransform().setRotation(rotation)

      this.temp ||= new Ammo.btVector3(0, 0, 0)
      body.setLinearVelocity(setVector(this.temp, this.velocity))
      body.setAngularVelocity(setVector(this.temp, ZERO))
      body.activate()
    }

    if (body) {
      const t = body.getWorldTransform()
      const o = t.getOrigin()
      const r = t.getRotation()
      vec4$init(this.transform.rotation, r.x(), r.y(), r.z(), r.w())
      vec3$init(this.transform.translation, o.x(), o.y(), o.z())
      this.transform.markAsChanged()
    }
  }
}

const ZERO = vec3(0)

function setVector(target: Ammo.btVector3, value: IVec3) {
  target.setValue(value.x, value.y, value.z)
  return target
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
  }
  return new Ammo.btEmptyShape()
}
