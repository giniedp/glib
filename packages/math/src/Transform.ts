import { Mat4 } from './Mat4'
import { Quat } from './Quat'
import { IVec3, IVec4 } from './Types'
import { Vec3 } from './Vec3'

const tempQuat = Quat.createIdentity()
const tempMat = Mat4.createIdentity()
const tempVec = Vec3.createZero()

export interface ITransformBase {
  /**
   * Translation part
   */
  translation: IVec3

  /**
   * Rotation part
   */
  rotation: IVec4

  /**
   * Scale part
   */
  scale: IVec3
}

export interface ITransform extends ITransformBase {
  /**
   * The local transform matrix based on the {@link ITransformBase.translation},
   * {@link ITransformBase.rotation} and  {@link ITransformBase.scale} properties
   */
  matrix: Mat4
}

export class Transform<T = unknown> implements ITransform {
  public static removeFromArray = removeFromArrayUnstable

  /**
   * A user defined name of the transform
   */
  public name: string

  /**
   * User defined data attached to this transform
   */
  public data?: T

  /**
   * The parent transform component
   */
  public parent: Transform

  /**
   * The child transform components
   *
   * @remarks
   * Manipulating this array directly is not recommended. Use the `add*` methods instead.
   */
  public readonly children: Transform[] = []

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
  public readonly translation: Vec3 = new Vec3(0, 0, 0)

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
  public readonly matrix: Mat4 = Mat4.createIdentity()

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
  public needsUpdate: boolean = true

  protected worldInvChanged: boolean
  protected worldInv = Mat4.createIdentity()

  protected worldRotChanged: boolean
  protected worldRot = Quat.createIdentity()

  protected worldRotInvChanged: boolean
  protected worldRotInv = Quat.createIdentity()

  /**
   * Adds a child transform. Depending on the `keepWorld` flag, the operation is performed
   * in world or local space.
   */
  public addChild(child: Transform): void {
    child.setParent(this)
  }

  /**
   * Adds a child transform. The operation is performed in world space, meaning
   * that the world transform of the child keeps the same.
   */
  public addChildInWorld(child: Transform): void {
    child.setParentInWorld(this)
  }

  /**
   * Adds a child transform by moving it to the parents local space.
   * This will change the current world transform of the child.
   */
  public addChildInLocal(child: Transform): void {
    child.setParentInLocal(this)
  }

  /**
   * Sets the new parent. Depending on the `keepWorld` flag, the operation is performed
   * in world or local space.
   */
  public setParent(parent: Transform): void {
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
  public setParentInWorld(parent: Transform): void {
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
      Transform.removeFromArray(this.parent.children, this)
      this.parent = null
    }

    if (parent) {
      this.parent = parent
      this.parent.children.push(this)
      Mat4.premultiply(this.parent.worldInverse, this.world, this.matrix)
    } else {
      this.matrix.initFrom(this.world)
    }

    Mat4.decompose(this.matrix, this.scale, this.rotation, this.translation)
  }

  /**
   * Sets the new parent by moving it into the parents local space.
   * This will change the current world transform.
   */
  public setParentInLocal(parent: Transform): void {
    if (this.parent === parent) {
      return
    }
    if (parent == this) {
      throw new Error('Cannot set self as parent')
    }
    if (this.parent) {
      Transform.removeFromArray(this.parent.children, this)
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
  public update(up?: boolean, down?: boolean): void {
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
    this.matrix.initFromRTS(this.rotation, this.translation, this.scale)
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
    this.matrix.initFromRTS(this.rotation, this.translation, this.scale)

    if (this.parent) {
      Mat4.premultiply(this.matrix, this.parent.world, this.world)
    } else {
      this.world.initFrom(this.matrix)
    }

    this.needsUpdate = false
    this.worldInvChanged = true
    this.worldRotChanged = true
    this.worldRotInvChanged = true
    for (const child of this.children) {
      child.needsUpdate = true
    }
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
    this.translation.x = position.x
    this.translation.y = position.y
    this.translation.z = position.z
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
    this.translation.x = x
    this.translation.y = y
    this.translation.z = z
    this.needsUpdate = true
    return this
  }

  /**
   * Sets the new position coordinate and rises the `needsUpdate` flag
   *
   * @param x - The new x position
   */
  public setPositionX(x: number): this {
    this.translation.x = x
    this.needsUpdate = true
    return this
  }

  /**
   * Sets the new position coordinate and rises the `needsUpdate` flag
   *
   * @param y - The new y position
   */
  public setPositionY(y: number): this {
    this.translation.y = y
    this.needsUpdate = true
    return this
  }

  /**
   * Sets the new position coordinate and rises the `needsUpdate` flag
   *
   * @param z - The new z position
   */
  public setPositionZ(z: number): this {
    this.translation.z = z
    this.needsUpdate = true
    return this
  }

  /**
   * Translates the current position by the given amount and rises th `needsUpdate` flag
   *
   * @param delta - The translation amount
   */
  public translateV(delta: IVec3): this {
    this.translation.x += delta.x
    this.translation.y += delta.y
    this.translation.z += delta.z
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
    this.translation.x += dx
    this.translation.y += dy
    this.translation.z += dz
    this.needsUpdate = true
    return this
  }

  /**
   * Translates the current position by the given amount and rises th `needsUpdate` flag
   *
   * @param dx - The translation amount
   */
  public translateX(dx: number): this {
    this.translation.x += dx
    this.needsUpdate = true
    return this
  }

  /**
   * Translates the current position by the given amount and rises th `needsUpdate` flag
   *
   * @param dy - The translation amount
   */
  public translateY(dy: number): this {
    this.translation.y += dy
    this.needsUpdate = true
    return this
  }

  /**
   * Translates the current position by the given amount and rises th `needsUpdate` flag
   *
   * @param dz - The translation amount
   */
  public translateZ(dz: number): this {
    this.translation.z += dz
    this.needsUpdate = true
    return this
  }

  public lookAt(v: IVec3, up?: IVec3): this {
    this.rotation.initFromMat4(tempMat.initLookAt(this.translation, v, up || Vec3.Up))
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
    Vec3.add(this.translation, out)
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

function removeFromArrayUnstable<T>(array: T[], item: T): void {
  const index = array.indexOf(item)
  if (index < 0) {
    return
  }
  if (index < array.length - 1) {
    array[index] = array[array.length - 1]
  }
  array.length--
}
