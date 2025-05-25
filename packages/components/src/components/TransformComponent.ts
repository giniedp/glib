import { GameComponent, GameEntity } from '@gglib/ecs'
import { IVec3, IVec4, Mat4, Quat, Vec3 } from '@gglib/math'
import { simpleObservable } from '@gglib/utils'
import { GameTransform } from 'ecs/src/GameTransform'
import { GameLoop } from '../systems/GameLoop'

/**
 * Constructor options for {@link TransformComponent}
 *
 * @public
 */
export interface TransformComponentOptions {
  /**
   * The initial scale value in local space
   */
  scale?: IVec3

  /**
   * The initial position value in local space
   */
  position?: IVec3

  /**
   * The initial rotation value in local space
   */
  rotation?: IVec4

  /**
   * The initial local transform.
   *
   * @remarks
   * If set, the `position`, `rotation` and `scale` properties are ignored.
   */
  local?: Mat4

  /**
   * The initial world transform. Useful along with `keepWorld` to keep the world transform
   * when assigning a new parent.
   */
  world?: Mat4

  /**
   * Indicates that the world transform should be kept when the transform is set to a new parent
   */
  keepWorld?: boolean
}

const tempQuat = Quat.createIdentity()
const tempMat = Mat4.createIdentity()
const tempVec = Vec3.createZero()

/**
 * Provides access to the position rotation and scale of an entity
 *
 * @public
 * @remarks
 * Calculates the final world transform matrix once position, rotation or scale properties have changed.
 * Takes the transform of the parent entity into account if the parent also owns a `TransformComponent`
 */

export class TransformComponent implements GameComponent, GameTransform {
  public static removeFromArraySplice<T>(array: T[], item: T): void {
    const index = array.indexOf(item)
    if (index < 0) {
      return
    }
    array.splice(index, 1)
  }

  public static removeFromArrayRemap<T>(array: T[], item: T): void {
    const index = array.indexOf(item)
    if (index < 0) {
      return
    }
    if (index < array.length - 1) {
      array[index] = array[array.length - 1]
    }
    array.length--
  }

  public static removeFromArray = TransformComponent.removeFromArrayRemap

  /**
   * The entity that owns this component instance
   */
  public entity: GameEntity<TransformComponent>

  /**
   * The parent transform component
   */
  public parent: TransformComponent

  /**
   * The child transform components
   *
   * @remarks
   * Manipulating this array directly is not recommended. Use the `add*` methods instead.
   */
  public readonly children: TransformComponent[] = []

  /**
   * The scale vector in local space
   *
   * @remarks
   * Prefer not to change this property directly but instead by using the `set*` methods.
   * If changed directly, make sure that the `needsUpdate` property is set to true to
   * indicate that the matrix must be updated
   */
  public readonly scale: Vec3 = new Vec3(1, 1, 1)

  /**
   * The translation vector in local space
   *
   * @remarks
   * Prefer not to change this property directly but instead by using the `set*` methods.
   * If changed directly, make sure that the `needsUpdate` property is set to true to
   * indicate that the matrix must be updated
   */
  public readonly position: Vec3 = new Vec3(0, 0, 0)

  /**
   * The rotation quaternion in local space
   *
   * @remarks
   * Prefer not to change this property directly but instead by using the `set*` methods.
   * If changed directly, make sure that the `needsUpdate` property is set to true to
   * indicate that the matrix must be updated
   */
  public readonly rotation: Quat = new Quat(0, 0, 0, 1)

  /**
   * The current local transform matrix
   *
   * @remarks
   * This is updated automatically on every frame if the `needsUpdate` property
   * is `true`.
   */
  public readonly local: Mat4 = Mat4.createIdentity()

  /**
   * The current world transform matrix
   *
   * @remarks
   * This is updated automatically on every frame if the `needsUpdate` property
   * is `true`.
   */
  public readonly world: Mat4 = Mat4.createIdentity()

  /**
   * Indicates that the world transform should be kept when the transform is set to a new parent
   */
  public keepWorld: boolean = false

  /**
   * The inverse of the world matrix
   *
   * @remarks
   * This is marked as dirty on every frame, if `world` matrix has been updated.
   * The fnal value is recalculated on demand if needed.
   */
  public get worldInverse(): Mat4 {
    if (this.worldInvChanged) {
      Mat4.invert(this.world, this.worldInv)
      this.worldInvChanged = false
    }
    return this.worldInv
  }

  /**
   * The rotation in world space
   *
   * @remarks
   * This is marked as dirty on every frame, if `world` matrix has been updated.
   * The fnal value is recalculated on demand if needed.
   */
  public get worldRotation(): Quat {
    if (this.worldRotChanged) {
      this.worldRot.initFromMat4(this.world)
      this.worldRotChanged = false
    }
    return this.worldRot
  }

  /**
   * The iverse rotation in world space
   *
   * @remarks
   * This is marked as dirty on every frame, if `world` matrix has been updated.
   * The fnal value is recalculated on demand if needed.
   */
  public get worldRotationInverse(): Quat {
    if (this.worldRotInvChanged) {
      this.worldRotInv.initFrom(this.worldRotation).invert()
      this.worldRotInvChanged = false
    }
    return this.worldRotInv
  }

  /**
   * Indicates that the state has changed and the transform matrix must be updated
   *
   * @remarks
   * This flag is always raised when any state modifying method was called
   * on this component.
   *
   * If the state properties `scale`, `position` and `rotation` have been
   * changed from outside of this component this flag must be raised manually
   *
   * @example
   * ```ts
   * t.position.x += 1
   * t.changed = true
   * ```
   */
  public needsUpdate: boolean

  private worldInvChanged: boolean
  private worldInv = Mat4.createIdentity()

  private worldRotChanged: boolean
  private worldRot = Quat.createIdentity()

  private worldRotInvChanged: boolean
  private worldRotInv = Quat.createIdentity()

  private loop: GameLoop

  public onUpdated = simpleObservable<void>()

  constructor(options: TransformComponentOptions = {}) {
    if (options.scale) {
      this.scale.initFrom(options.scale)
    }
    if (options.position) {
      this.position.initFrom(options.position)
    }
    if (options.rotation) {
      this.rotation.initFrom(options.rotation)
    }
    if (options.local) {
      this.local.initFrom(options.local)
      this.local.decompose(this.position, this.rotation, this.scale)
    }
    if (options.world) {
      this.world.initFrom(options.world)
    }
    this.keepWorld = options.keepWorld ?? false
    this.needsUpdate = true
  }

  public initialize(entity: GameEntity<TransformComponent>): void {
    this.entity = entity
    this.entity.transform = this
    this.loop = entity.provider.get(GameLoop)
    this.needsUpdate = true
  }

  public activate(): void {
    this.loop.onUpdate.add(this.updateIfNeeded)
  }

  public deactivate(): void {
    this.loop.onUpdate.remove(this.updateIfNeeded)
  }

  public destroy(): void {
    this.entity.transform = null
  }

  /**
   * Adds a child transform. Depending on the `keepWorld` flag, the operation is performed
   * in world or local space.
   */
  public addChild(child: TransformComponent): void {
    child.setParent(this)
  }

  /**
   * Adds a child transform. The operation is performed in world space, meaning
   * that the world transform of the child keeps the same.
   */
  public addChildInWorld(child: TransformComponent): void {
    child.setParentInWorld(this)
  }

  /**
   * Adds a child transform by moving it to the parents local space.
   * This will change the current world transform of the child.
   */
  public addChildInLocal(child: TransformComponent): void {
    child.setParentInLocal(this)
  }

  /**
   * Sets the new parent. Depending on the `keepWorld` flag, the operation is performed
   * in world or local space.
   */
  public setParent(parent: TransformComponent): void {
    if (this.keepWorld) {
      this.setParentInWorld(parent)
    } else {
      this.setParentInLocal(parent)
    }
  }

  /**
   * Sets the new parent. The operation is performed in world space, meaning
   * that our world transform stays unchanged.
   */
  public setParentInWorld(parent: TransformComponent): void {
    if (this.parent === parent) {
      return
    }
    if (parent == this) {
      throw new Error('Cannot set self as parent')
    }

    // make sure the world transform is up to date
    this.parent?.updateIfNeeded()
    this.updateIfNeeded()
    parent?.updateIfNeeded()

    if (this.parent) {
      this.parent.updateIfNeeded()
      TransformComponent.removeFromArray(this.parent.children, this)
      this.parent = null
    }

    if (parent) {
      this.parent = parent
      this.parent.children.push(this)
      Mat4.premultiply(this.parent.worldInverse, this.world, this.local)
    } else {
      this.local.initFrom(this.world)
    }

    Mat4.decompose(this.local, this.scale, this.rotation, this.position)
  }

  /**
   * Sets the new parent by moving it into the parents local space.
   * This will change the current world transform.
   */
  public setParentInLocal(parent: TransformComponent): void {
    if (this.parent === parent) {
      return
    }
    if (parent == this) {
      throw new Error('Cannot set self as parent')
    }
    if (this.parent) {
      TransformComponent.removeFromArray(this.parent.children, this)
      this.parent = null
    }
    if (parent) {
      this.parent = parent
      this.parent.children.push(this)
    }
    this.needsUpdate = true
  }

  /**
   * Updates the transform up and down the hierarchy
   *
   * @param up updates the parents first
   * @param down calls update on all children
   */
  public update(up: boolean, down: boolean): void {
    if (up && this.parent) {
      this.parent.update(up, false)
    }
    this.updateIfNeeded()
    if (down) {
      for (const child of this.children) {
        child.update(false, down)
      }
    }
  }

  /**
   * If the `needsUpdate` flag is set to true, updates the world transform and emits the `onUpdated` event
   */
  public updateIfNeeded = () => {
    if (this.needsUpdate) {
      this.updateWorldTransform()
    }
  }

  /**
   * Updates the local transform matrix and sets the `needsUpdate` flag to true
   */
  public updateLocalTransform(): void {
    this.local.initFromPosRotScale(this.position, this.rotation, this.scale)
    this.needsUpdate = true
  }

  /**
   * Updates the local and world transforms.
   *
   * @remarks
   * - Ignores the `needsUpdate` flag, but sets it to false after the update.
   * - Emits the `onUpdated` event.
   */
  public updateWorldTransform(): void {
    this.local.initFromPosRotScale(this.position, this.rotation, this.scale)

    if (this.parent) {
      Mat4.premultiply(this.local, this.parent.world, this.world)
    } else {
      this.world.initFrom(this.local)
    }

    this.needsUpdate = false
    this.worldInvChanged = true
    this.worldRotChanged = true
    this.worldRotInvChanged = true
    for (const child of this.children) {
      child.needsUpdate = true
    }
    this.onUpdated.notify()
  }

  /**
   * Sets the rotation using the given quaternion and rises the `needsUpdate` flag
   *
   * @param quaternion - The quaternion to initialize from
   */
  public setRotation(quaternion: IVec4): this {
    this.rotation.initFrom(quaternion)
    this.needsUpdate = true
    return this
  }

  /**
   * Sets the rotation from an axis and angle and rises the `needsUpdate` flag
   *
   * @param axis - The rotation axis
   * @param angle - The rotation angle in radians
   */
  public setRotationAxisAngleV(axis: IVec3, angle: number): this {
    this.rotation.initAxisAngle(axis, angle)
    this.needsUpdate = true
    return this
  }

  /**
   * Sets the rotation from an axis and angle and rises the `needsUpdate` flag
   *
   * @param x - Rotation axis X parameter
   * @param y - Rotation axis Y parameter
   * @param z - Rotation axis Z parameter
   * @param angle - The rotation angle in radians
   */
  public setRotationAxisAngle(x: number, y: number, z: number, angle: number): this {
    this.rotation.initAxisAngle(tempVec.init(x, y, z).normalize(), angle)
    this.needsUpdate = true
    return this
  }

  /**
   * Sets the rotation from yaw pitch roll angles and rises the `needsUpdate` flag
   *
   * @param yaw - The yaw angle in rad
   * @param pitch - The pitch angle in rad
   * @param roll - The roll angle in rad
   */
  public setRotationYawPitchRoll(yaw: number, pitch: number, roll: number): this {
    this.rotation.initYawPitchRoll(yaw, pitch, roll)
    this.needsUpdate = true
    return this
  }

  /**
   * Concats the given rotation to the current state and rises the `needsUpdate` flag
   *
   * @param axis - The rotation axis
   * @param angle - The rotation angle in rad
   */
  public rotateAxisAngleV(axis: IVec3, angle: number): this {
    this.rotation.preMultiply(tempQuat.initAxisAngle(axis, angle))
    this.needsUpdate = true
    return this
  }

  /**
   * Concats the given rotation to the current state and rises the `needsUpdate` flag
   *
   * @param x - Rotation axis X parameter
   * @param y - Rotation axis Y parameter
   * @param z - Rotation axis Z parameter
   * @param angle - The rotation angle in radians
   */
  public rotateAxisAngle(x: number, y: number, z: number, angle: number): this {
    return this.rotateAxisAngleV(tempVec.init(x, y, z), angle)
  }

  /**
   * Concats the given rotation to the current state and rises the `needsUpdate` flag
   *
   * @param yaw - The yaw angle in rad
   * @param pitch - The pitch angle in rad
   * @param roll - The roll angle in rad
   */
  public rotateYawPitchRoll(yaw: number, pitch: number, roll: number): this {
    this.rotation.preMultiply(tempQuat.initYawPitchRoll(yaw, pitch, roll))
    this.needsUpdate = true
    return this
  }

  /**
   * Sets the scale from given vector and rises the `needsUpdate` flag
   *
   * @param scale - The scale vector to initialize from
   */
  public setScaleV(scale: IVec3): this {
    this.scale.x = scale.x
    this.scale.y = scale.y
    this.scale.z = scale.z
    this.needsUpdate = true
    return this
  }

  /**
   * Sets the x, y and z scale factors rises the `needsUpdate` flag
   *
   * @param scaleX - The new x scale factor
   * @param scaleY - The new y scale factor
   * @param scaleZ - The new z scale factor
   */
  public setScale(scaleX: number, scaleY: number, scaleZ: number): this {
    this.scale.x = scaleX
    this.scale.y = scaleY
    this.scale.z = scaleZ
    this.needsUpdate = true
    return this
  }

  /**
   * Sets the x scale factor rises the `needsUpdate` flag
   *
   * @param scale - The new scale factor
   */
  public setScaleX(scale: number): this {
    this.scale.x = scale
    this.needsUpdate = true
    return this
  }

  /**
   * Sets the y scale factor rises the `needsUpdate` flag
   *
   * @param scale - The new scale factor
   */
  public setScaleY(scale: number): this {
    this.scale.y = scale
    this.needsUpdate = true
    return this
  }

  /**
   * Sets the z scale factor rises the `needsUpdate` flag
   *
   * @param scale - The new scale factor
   */
  public setScaleZ(scale: number): this {
    this.scale.z = scale
    this.needsUpdate = true
    return this
  }

  /**
   * Sets a uniform scale factor and rises the `needsUpdate` flag
   *
   * @param value - The new uniform scale factor
   */
  public setScaleUniform(value: number): this {
    this.scale.x = value
    this.scale.y = value
    this.scale.z = value
    this.needsUpdate = true
    return this
  }

  /**
   * Applies the given scale factor on top of the current state and rises the `needsUpdate` flag
   *
   * @param scale - The scale factor to apply
   */
  public scaleByV(scale: IVec3): this {
    this.scale.x *= scale.x
    this.scale.y *= scale.y
    this.scale.z *= scale.z
    this.needsUpdate = true
    return this
  }

  /**
   * Applies the given scale factor on top of the current state and rises the `needsUpdate` flag
   *
   * @param scale - The scale factor to apply
   */
  public scaleX(scale: number): this {
    this.scale.x *= scale
    this.needsUpdate = true
    return this
  }

  /**
   * Applies the given scale factor on top of the current state and rises the `needsUpdate` flag
   *
   * @param scale - The scale factor to apply
   */
  public scaleY(scale: number): this {
    this.scale.y *= scale
    this.needsUpdate = true
    return this
  }

  /**
   * Applies the given scale factor on top of the current state and rises the `needsUpdate` flag
   *
   * @param scale - The scale factor to apply
   */
  public scaleZ(scale: number): this {
    this.scale.z *= scale
    this.needsUpdate = true
    return this
  }

  /**
   * Applies the given scale factor on top of the current state and rises the `needsUpdate` flag
   *
   * @param scaleX - The x scale factor to apply
   * @param scaleY - The y scale factor to apply
   * @param scaleZ - The z scale factor to apply
   */
  public scaleBy(scaleX: number, scaleY: number, scaleZ: number): this {
    this.scale.x *= scaleX
    this.scale.y *= scaleY
    this.scale.z *= scaleZ
    this.needsUpdate = true
    return this
  }

  /**
   * Applies the given scale factor on top of the current state and rises the `needsUpdate` flag
   *
   * @param scale - The scale factor to apply
   */
  public scaleUniform(scale: number): this {
    this.scale.x *= scale
    this.scale.y *= scale
    this.scale.z *= scale
    this.needsUpdate = true
    return this
  }

  /**
   * Sets the new position and rises the `needsUpdate` flag
   *
   * @param position - The position to copy
   */
  public setPositionV(position: IVec3): this {
    this.position.x = position.x
    this.position.y = position.y
    this.position.z = position.z
    this.needsUpdate = true
    return this
  }

  /**
   * Sets the new position and rises the `needsUpdate` flag
   *
   * @param x - The new x position
   * @param y - The new y position
   * @param z - The new z position
   */
  public setPosition(x: number, y: number, z: number): this {
    this.position.x = x
    this.position.y = y
    this.position.z = z
    this.needsUpdate = true
    return this
  }

  /**
   * Sets the new position coordinate and rises the `needsUpdate` flag
   *
   * @param x - The new x position
   */
  public setPositionX(x: number): this {
    this.position.x = x
    this.needsUpdate = true
    return this
  }

  /**
   * Sets the new position coordinate and rises the `needsUpdate` flag
   *
   * @param y - The new y position
   */
  public setPositionY(y: number): this {
    this.position.y = y
    this.needsUpdate = true
    return this
  }

  /**
   * Sets the new position coordinate and rises the `needsUpdate` flag
   *
   * @param z - The new z position
   */
  public setPositionZ(z: number): this {
    this.position.z = z
    this.needsUpdate = true
    return this
  }

  /**
   * Translates the current position by the given amount and rises th `needsUpdate` flag
   *
   * @param delta - The translation amount
   */
  public translateV(delta: IVec3): this {
    this.position.x += delta.x
    this.position.y += delta.y
    this.position.z += delta.z
    this.needsUpdate = true
    return this
  }

  /**
   * Translates the current position by the given amount and rises th `needsUpdate` flag
   *
   * @param dx - The translation amount in x direction
   * @param dy - The translation amount in y direction
   * @param dz - The translation amount in z direction
   */
  public translate(dx: number, dy: number, dz: number): this {
    this.position.x += dx
    this.position.y += dy
    this.position.z += dz
    this.needsUpdate = true
    return this
  }

  /**
   * Translates the current position by the given amount and rises th `needsUpdate` flag
   *
   * @param dx - The translation amount
   */
  public translateX(dx: number): this {
    this.position.x += dx
    this.needsUpdate = true
    return this
  }

  /**
   * Translates the current position by the given amount and rises th `needsUpdate` flag
   *
   * @param dy - The translation amount
   */
  public translateY(dy: number): this {
    this.position.y += dy
    this.needsUpdate = true
    return this
  }

  /**
   * Translates the current position by the given amount and rises th `needsUpdate` flag
   *
   * @param dz - The translation amount
   */
  public translateZ(dz: number): this {
    this.position.z += dz
    this.needsUpdate = true
    return this
  }

  public lookAt(v: IVec3, up?: IVec3): this {
    this.rotation.initFromMat4(tempMat.initLookAt(this.position, v, up || Vec3.Up))
    this.needsUpdate = true
    return this
  }

  /**
   * Transforms the given point with the current `rotation`, `scale` and `position` state
   *
   * @param v - The vector to transform
   * @param out - The vector to write to
   * @returns The given `out` parameter or a new vector.
   */
  public transform<T extends IVec3>(v: IVec3, out?: T): T {
    Quat.transform(this.rotation, v, out)
    Vec3.multiply(this.scale, out, out)
    Vec3.add(this.position, out)
    return out
  }

  /**
   * Transforms the given vector with the current `rotation` and `scale` state
   *
   * @param v - The vector to transform
   * @param out - The vector to write to
   * @returns The given `out` parameter or a new vector.
   */
  public transformNormal<T extends IVec3>(v: IVec3, out?: T): T {
    Quat.transform(this.rotation, v, out)
    Vec3.multiply(this.scale, out, out)
    return out
  }
}
