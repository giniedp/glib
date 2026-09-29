import {
  Mat4,
  mat4$initFrom,
  mat4$initFromRTS,
  mat4$initLookAt,
  mat4Decompose,
  mat4Identity,
  mat4Invert,
  mat4Premultiply,
} from './Mat4'
import {
  quat$initAxisAngle,
  quat$initFromMat4,
  quat$initYawPitchRoll,
  quat$invert,
  quat$premultiply,
  quatCreateIdentity,
} from './Quat'
import type { IVec3, IVec4 } from './Types'
import { vec3, vec3$add, vec3$init, vec3$multiply, vec3$normalize, vec3ApplyQuat } from './Vec3'
import { vec4, vec4$initFrom } from './Vec4'

const tempQuat = quatCreateIdentity()
const tempMat = mat4Identity()

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
  /**
   * Removes the given item from the array.
   * This is an unstable operation, meaning that it does not preserve the order of the array.
   */
  public static remove = removeItemUnordered

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
  public parent: this

  /**
   * The child transform components
   *
   * @remarks
   * Manipulating this array directly is not recommended. Use the `add*` methods instead.
   */
  public readonly children: this[] = []

  public get version() {
    return this.lastVersion
  }

  protected lastVersion: number = 0
  protected nextVersion: number = 0
  protected subtreeChanged = true

  public get hasChanged(): boolean {
    return this.nextVersion !== this.lastVersion
  }

  /**
   * The scale vector in local space
   *
   * @remarks
   * Prefer not to change this property directly but instead by using the `set*` methods.
   * If changed directly, make sure that the `needsUpdate` property is set to true to
   * indicate that the matrix must be updated
   */
  public readonly scale: IVec3 = vec3(1)

  /**
   * The translation vector in local space
   *
   * @remarks
   * Prefer not to change this property directly but instead by using the `set*` methods.
   * If changed directly, make sure that the `needsUpdate` property is set to true to
   * indicate that the matrix must be updated
   */
  public readonly translation: IVec3 = vec3(0)

  /**
   * The rotation quaternion in local space
   *
   * @remarks
   * Prefer not to change this property directly but instead by using the `set*` methods.
   * If changed directly, make sure that the `needsUpdate` property is set to true to
   * indicate that the matrix must be updated
   */
  public readonly rotation: IVec4 = vec4(0, 0, 0, 1)

  /**
   * The current local transform matrix
   *
   * @remarks
   * This is updated automatically on every frame if the `needsUpdate` property
   * is `true`.
   */
  public readonly matrix: Mat4 = mat4Identity()

  /**
   * The current world transform matrix
   *
   * @remarks
   * This is updated automatically on every frame if the `needsUpdate` property
   * is `true`.
   */
  public readonly world: Mat4 = mat4Identity()

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
      mat4Invert(this.world, this.worldInv)
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
  public get worldRotation(): IVec4 {
    if (this.worldRotChanged) {
      quat$initFromMat4(this.worldRot, this.world)
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
  public get worldRotationInverse(): IVec4 {
    if (this.worldRotInvChanged) {
      quat$initFromMat4(this.worldRot, this.world)
      quat$invert(this.worldRot)
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
  //public needsUpdate: boolean = true

  protected worldInvChanged: boolean
  protected worldInv = mat4Identity()

  protected worldRotChanged: boolean
  protected worldRot = quatCreateIdentity()

  protected worldRotInvChanged: boolean
  protected worldRotInv = quatCreateIdentity()

  /**
   * Adds a child transform. Depending on the `keepWorld` flag, the operation is performed
   * in world or local space.
   */
  public addChild(child: this): void {
    child.setParent(this)
  }

  /**
   * Adds a child transform. The operation is performed in world space, meaning
   * that the world transform of the child keeps the same.
   */
  public addChildInWorld(child: this): void {
    child.setParentInWorld(this)
  }

  /**
   * Adds a child transform by moving it to the parents local space.
   * This will change the current world transform of the child.
   */
  public addChildInLocal(child: this): void {
    child.setParentInLocal(this)
  }

  /**
   * Shorthand for `setParent(null)`
   */
  public detach() {
    this.setParent(null)
  }

  /**
   * Shorthand for `setParentInWorld(null)`
   */
  public detachInWorld() {
    this.setParentInWorld(null)
  }

  /**
   * Shorthand for `setParentInLocal(null)`
   */
  public detachInLocal() {
    this.setParentInLocal(null)
  }

  /**
   * Sets the new parent. Depending on the `keepWorld` flag, the operation is performed
   * in world or local space.
   */
  public setParent(parent: this): void {
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
  public setParentInWorld(parent: this): void {
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

    const oldParent = this.parent
    if (this.parent) {
      this.parent.updateIfNeeded()
      Transform.remove(this.parent.children, this)
      this.parent = null
    }

    if (parent) {
      this.parent = parent
      this.parent.children.push(this)
      mat4Premultiply(this.parent.worldInverse, this.world, this.matrix)
    } else {
      mat4$initFrom(this.matrix, this.world)
    }

    mat4Decompose(this.matrix, this.scale, this.rotation, this.translation)
    this.handleParentChange(parent, oldParent)
  }

  /**
   * Sets the new parent by moving it into the parents local space.
   * This will change the current world transform.
   */
  public setParentInLocal(parent: this): void {
    if (this.parent === parent) {
      return
    }
    if (parent == this) {
      throw new Error('Cannot set self as parent')
    }
    const oldParent = this.parent
    if (this.parent) {
      Transform.remove(this.parent.children, this)
      this.parent = null
    }
    if (parent) {
      this.parent = parent
      this.parent.children.push(this)
    }
    this.markAsChanged()
    this.handleParentChange(parent, oldParent)
  }

  protected handleParentChange(parent: this, oldParent: this) {
    //
  }

  /**
   * Updates the transform up and down the hierarchy
   *
   * @param up updates the parents first
   * @param down calls update on all children
   */
  public propagateUpdates(up?: boolean, down?: boolean): void {
    if (up) {
      this.propagateUpdatesUp()
    }
    if (down) {
      this.propagateUpdatesDown()
    }
  }

  private propagateUpdatesUp(): void {
    if (this.parent) {
      this.parent.propagateUpdatesUp()
    }
    if (this.hasChanged) {
      this.updateWorldTransform()
    }
  }

  private propagateUpdatesDown(): void {
    if (this.hasChanged) {
      this.updateWorldTransform()
    }
    if (!this.subtreeChanged) {
      return
    }
    this.subtreeChanged = false
    for (const child of this.children) {
      child.propagateUpdatesDown()
    }
  }

  /**
   * If the `needsUpdate` flag is set to true, updates the world transform and emits the `onUpdated` event
   */
  public updateIfNeeded = () => {
    if (this.hasChanged) {
      this.updateWorldTransform()
    }
  }

  /**
   * Bumps the `version` property to indicate that the state has changed and the transform needs to be updated.
   */
  public markAsChanged() {
    this.nextVersion++
    this.subtreeChanged = true
    let parent: this = this.parent
    while (parent) {
      parent.subtreeChanged = true
      parent = parent.parent
    }
  }

  /**
   * Marks the current state as updated by setting the `lastVersion` to the current `version`.
   */
  public markAsUpdated() {
    this.lastVersion = this.nextVersion
  }

  public handleWorldUpdated() {
    this.lastVersion = this.nextVersion
    this.worldInvChanged = true
    this.worldRotChanged = true
    this.worldRotInvChanged = true
  }

  /**
   * Updates the local transform matrix and sets the `needsUpdate` flag to true
   */
  public updateLocalTransform(): void {
    mat4$initFromRTS(this.matrix, this.rotation, this.translation, this.scale)
    this.nextVersion++
  }

  /**
   * Updates the local and world transforms.
   */
  public updateWorldTransform(): void {
    mat4$initFromRTS(this.matrix, this.rotation, this.translation, this.scale)
    this.subtreeChanged = true
    if (this.parent) {
      mat4Premultiply(this.matrix, this.parent.world, this.world)
    } else {
      mat4$initFrom(this.world, this.matrix)
    }

    this.handleWorldUpdated()

    for (const child of this.children) {
      child.nextVersion++
    }
  }

  /**
   * Sets the rotation using the given quaternion and rises the `needsUpdate` flag
   *
   * @param quaternion - The quaternion to initialize from
   */
  public setRotation(quaternion: IVec4): this {
    vec4$initFrom(this.rotation, quaternion)
    this.markAsChanged()
    return this
  }

  /**
   * Sets the rotation from an axis and angle and rises the `needsUpdate` flag
   *
   * @param axis - The rotation axis
   * @param angle - The rotation angle in radians
   */
  public setRotationAxisAngleV(axis: IVec3, angle: number): this {
    quat$initAxisAngle(this.rotation, axis, angle)
    this.markAsChanged()
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
    vec3$init(vec3.$0, x, y, z)
    vec3$normalize(vec3.$0)
    quat$initAxisAngle(this.rotation, vec3.$0, angle)
    this.markAsChanged()
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
    quat$initYawPitchRoll(this.rotation, yaw, pitch, roll)
    this.markAsChanged()
    return this
  }

  /**
   * Concats the given rotation to the current state and rises the `needsUpdate` flag
   *
   * @param axis - The rotation axis
   * @param angle - The rotation angle in rad
   */
  public rotateAxisAngleV(axis: IVec3, angle: number): this {
    quat$premultiply(this.rotation, quat$initAxisAngle(tempQuat, axis, angle))
    this.markAsChanged()
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
    vec3$init(vec3.$0, x, y, z)
    return this.rotateAxisAngleV(vec3.$0, angle)
  }

  /**
   * Concats the given rotation to the current state and rises the `needsUpdate` flag
   *
   * @param yaw - The yaw angle in rad
   * @param pitch - The pitch angle in rad
   * @param roll - The roll angle in rad
   */
  public rotateYawPitchRoll(yaw: number, pitch: number, roll: number): this {
    quat$premultiply(this.rotation, quat$initYawPitchRoll(tempQuat, yaw, pitch, roll))
    this.markAsChanged()
    return this
  }

  /**
   * Sets the scale from given vector and rises the `needsUpdate` flag
   *
   * @param scale - The scale vector to initialize from
   */
  public setScale(scale: IVec3): this {
    this.scale.x = scale.x
    this.scale.y = scale.y
    this.scale.z = scale.z
    this.markAsChanged()
    return this
  }

  /**
   * Sets the x, y and z scale factors rises the `needsUpdate` flag
   *
   * @param scaleX - The new x scale factor
   * @param scaleY - The new y scale factor
   * @param scaleZ - The new z scale factor
   */
  public setScaleXYZ(scaleX: number, scaleY: number, scaleZ: number): this {
    this.scale.x = scaleX
    this.scale.y = scaleY
    this.scale.z = scaleZ
    this.markAsChanged()
    return this
  }

  /**
   * Sets the x scale factor rises the `needsUpdate` flag
   *
   * @param scale - The new scale factor
   */
  public setScaleX(scale: number): this {
    this.scale.x = scale
    this.markAsChanged()
    return this
  }

  /**
   * Sets the y scale factor rises the `needsUpdate` flag
   *
   * @param scale - The new scale factor
   */
  public setScaleY(scale: number): this {
    this.scale.y = scale
    this.markAsChanged()
    return this
  }

  /**
   * Sets the z scale factor rises the `needsUpdate` flag
   *
   * @param scale - The new scale factor
   */
  public setScaleZ(scale: number): this {
    this.scale.z = scale
    this.markAsChanged()
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
    this.markAsChanged()
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
    this.markAsChanged()
    return this
  }

  /**
   * Applies the given scale factor on top of the current state and rises the `needsUpdate` flag
   *
   * @param scale - The scale factor to apply
   */
  public scaleX(scale: number): this {
    this.scale.x *= scale
    this.markAsChanged()
    return this
  }

  /**
   * Applies the given scale factor on top of the current state and rises the `needsUpdate` flag
   *
   * @param scale - The scale factor to apply
   */
  public scaleY(scale: number): this {
    this.scale.y *= scale
    this.markAsChanged()
    return this
  }

  /**
   * Applies the given scale factor on top of the current state and rises the `needsUpdate` flag
   *
   * @param scale - The scale factor to apply
   */
  public scaleZ(scale: number): this {
    this.scale.z *= scale
    this.markAsChanged()
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
    this.markAsChanged()
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
    this.markAsChanged()
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
    this.markAsChanged()
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
    this.markAsChanged()
    return this
  }

  /**
   * Sets the new position coordinate and rises the `needsUpdate` flag
   *
   * @param x - The new x position
   */
  public setPositionX(x: number): this {
    this.translation.x = x
    this.markAsChanged()
    return this
  }

  /**
   * Sets the new position coordinate and rises the `needsUpdate` flag
   *
   * @param y - The new y position
   */
  public setPositionY(y: number): this {
    this.translation.y = y
    this.markAsChanged()
    return this
  }

  /**
   * Sets the new position coordinate and rises the `needsUpdate` flag
   *
   * @param z - The new z position
   */
  public setPositionZ(z: number): this {
    this.translation.z = z
    this.markAsChanged()
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
    this.markAsChanged()
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
    this.markAsChanged()
    return this
  }

  /**
   * Translates the current position by the given amount and rises th `needsUpdate` flag
   *
   * @param dx - The translation amount
   */
  public translateX(dx: number): this {
    this.translation.x += dx
    this.markAsChanged()
    return this
  }

  /**
   * Translates the current position by the given amount and rises th `needsUpdate` flag
   *
   * @param dy - The translation amount
   */
  public translateY(dy: number): this {
    this.translation.y += dy
    this.markAsChanged()
    return this
  }

  /**
   * Translates the current position by the given amount and rises th `needsUpdate` flag
   *
   * @param dz - The translation amount
   */
  public translateZ(dz: number): this {
    this.translation.z += dz
    this.markAsChanged()
    return this
  }

  public lookAt(v: IVec3, up: IVec3): this {
    mat4$initLookAt(tempMat, this.translation, v, up)
    quat$initFromMat4(this.rotation, tempMat)
    this.markAsChanged()
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
    vec3ApplyQuat(v, this.rotation, out)
    vec3$multiply(out, this.scale)
    vec3$add(out, this.translation)
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
    vec3ApplyQuat(v, this.rotation, out)
    vec3$multiply(out, this.scale)
    return out
  }
}

function removeItemUnordered<T>(array: T[], item: T): void {
  const index = array.indexOf(item)
  if (index < 0) {
    return
  }
  if (index < array.length - 1) {
    array[index] = array[array.length - 1]
  }
  array.length--
}

function removeItem<T>(array: T[], item: T): void {
  const index = array.indexOf(item)
  if (index < 0) {
    return
  }
  array.splice(index, 1)
}
