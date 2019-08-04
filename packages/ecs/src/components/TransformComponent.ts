import { IVec3, IVec4, Mat4, Quat, Vec3 } from '@gglib/math'
import { getOption } from '@gglib/utils'

import { Inject, Service } from '../decorators'
import { Entity } from '../Entity'
import { OnUpdate } from './../Component'

/**
 * Constructor options for {@link TransformComponent}
 *
 * @public
 */
export interface TransformComponentOptions {
  /**
   * The initial scale value
   */
  scale?: IVec3
  /**
   * The initial position value
   */
  position?: IVec3
  /**
   * The initial rotation value
   */
  rotation?: IVec4
}

const tempQuat = Quat.createIdentity()
const tempMat = Mat4.createIdentity()
const tempVec = Vec3.createZero()

/**
 * @public
 */
@Service()
export class TransformComponent implements OnUpdate {

  /**
   * The name identifying this component
   */
  public readonly name = 'Transform'

  /**
   * The entity that owns this component instance
   */
  @Inject(Entity)
  public readonly entity: Entity

  /**
   * The current scale state
   *
   * @remarks
   * Prefer not to change this property directly but instead by using the `set*` methods.
   * If changed directly, make sure that the `dirty` property is set to true to
   * indicate that the matrix must be updated
   */
  public readonly scale: Vec3
  /**
   * The current translation state
   *
   * @remarks
   * Prefer not to change this property directly but instead by using the `set*` methods.
   * If changed directly, make sure that the `dirty` property is set to true to
   * indicate that the matrix must be updated
   */
  public readonly position: Vec3
  /**
   * The current rotation state
   *
   * @remarks
   * Prefer not to change this property directly but instead by using the `set*` methods.
   * If changed directly, make sure that the `dirty` property is set to true to
   * indicate that the matrix must be updated
   */
  public readonly rotation: Quat

  /**
   * The current transform matrix.
   *
   * @remarks
   * This is updated automatically on every frame if the `dirty` property
   * is `true`.
   */
  public readonly matrix: Mat4 = Mat4.createIdentity()
  /**
   * The current inverse of the transform matrix.
   *
   * @remarks
   * This is updated automatically on every frame if the `dirty` property
   * is `true`.
   */
  public readonly inverse: Mat4 = Mat4.createIdentity()

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
   * t.dirty = true
   * ```
   */
  public dirty: boolean

  constructor(options: TransformComponentOptions = {}) {
    this.scale = Vec3.convert(getOption(options, 'scale', Vec3.createOne()))
    this.position = Vec3.convert(getOption(options, 'position', Vec3.createZero()))
    this.rotation = Quat.convert(getOption(options, 'rotation', Quat.createIdentity()))
    this.dirty = true
  }

  /**
   * Updates the {@link TransformComponent.matrix} and {@link TransformComponent.inverse}
   * but only if the `dirty` flag is true
   */
  public onUpdate() {
    if (this.dirty) {
      this.matrix
        .initScaleV(this.scale)
        .premultiply(tempMat.initFromQuat(this.rotation))
        .setTranslationV(this.position)
      Mat4.invert(this.matrix, this.inverse)
      this.dirty = false
    }
  }

  /**
   * Sets the rotation using the given quaternion and rises the `dirty` flag
   *
   * @param quaternion - The quaternion to initialize from
   */
  public setRotation(quaternion: IVec4): this {
    this.rotation.initFrom(quaternion)
    this.dirty = true
    return this
  }

  /**
   * Sets the rotation from an axis and angle and rises the `dirty` flag
   *
   * @param axis - The rotation axis
   * @param angle - The rotation angle in radians
   */
  public setRotationAxisAngle(axis: IVec3, angle: number): this {
    this.rotation.initAxisAngle(axis, angle)
    this.dirty = true
    return this
  }

  /**
   * Sets the rotation from an axis and angle and rises the `dirty` flag
   *
   * @param x - Rotation axis X parameter
   * @param y - Rotation axis Y parameter
   * @param z - Rotation axis Z parameter
   * @param angle - The rotation angle in radians
   */
  public setRotationAnglePara(x: number, y: number, z: number, angle: number): this {
    this.rotation.initAxisAngle(tempVec.init(x, y, z).normalize(), angle)
    this.dirty = true
    return this
  }

  /**
   * Sets the rotation from yaw pitch roll angles and rises the `dirty` flag
   *
   * @param yaw - The yaw angle in rad
   * @param pitch - The pitch angle in rad
   * @param roll - The roll angle in rad
   */
  public setRotationYawPitchRoll(yaw: number, pitch: number, roll: number): this {
    this.rotation.initYawPitchRoll(yaw, pitch, roll)
    this.dirty = true
    return this
  }

  /**
   * Concats the given rotation to the current state and rises the `dirty` flag
   *
   * @param axis - The rotation axis
   * @param angle - The rotation angle in rad
   */
  public rotateAxisAngle(axis: IVec3, angle: number): this {
    this.rotation.concat(tempQuat.initAxisAngle(axis, angle))
    this.dirty = true
    return this
  }

  /**
   * Concats the given rotation to the current state and rises the `dirty` flag
   *
   * @param x - Rotation axis X parameter
   * @param y - Rotation axis Y parameter
   * @param z - Rotation axis Z parameter
   * @param angle - The rotation angle in radians
   */
  public rotateAxisAnglePara(x: number, y: number, z: number, angle: number): this {
    return this.rotateAxisAngle(tempVec.init(x, y, z), angle)
  }

  /**
   * Concats the given rotation to the current state and rises the `dirty` flag
   *
   * @param yaw - The yaw angle in rad
   * @param pitch - The pitch angle in rad
   * @param roll - The roll angle in rad
   */
  public rotateYawPitchRoll(yaw: number, pitch: number, roll: number): this {
    this.rotation.concat(tempQuat.initYawPitchRoll(yaw, pitch, roll))
    this.dirty = true
    return this
  }

  /**
   * Sets the scale from given vector and rises the `dirty` flag
   *
   * @param scale - The scale vector to initialize from
   */
  public setScale(scale: IVec3): this {
    this.scale.x = scale.x
    this.scale.y = scale.y
    this.scale.z = scale.z
    this.dirty = true
    return this
  }

  /**
   * Sets the x scale factor rises the `dirty` flag
   *
   * @param scale - The new scale factor
   */
  public setScaleX(scale: number): this {
    this.scale.x = scale
    this.dirty = true
    return this
  }

  /**
   * Sets the y scale factor rises the `dirty` flag
   *
   * @param scale - The new scale factor
   */
  public setScaleY(scale: number): this {
    this.scale.y = scale
    this.dirty = true
    return this
  }

  /**
   * Sets the z scale factor rises the `dirty` flag
   *
   * @param scale - The new scale factor
   */
  public setScaleZ(scale: number): this {
    this.scale.z = scale
    this.dirty = true
    return this
  }

  /**
   * Sets the x, y and z scale factors rises the `dirty` flag
   *
   * @param scaleX - The new x scale factor
   * @param scaleY - The new y scale factor
   * @param scaleZ - The new z scale factor
   */
  public setScaleXYZ(scaleX: number, scaleY: number, scaleZ: number): this {
    this.scale.x = scaleX
    this.scale.y = scaleY
    this.scale.z = scaleZ
    this.dirty = true
    return this
  }

  /**
   * Sets a uniform scale factor and rises the `dirty` flag
   *
   * @param value - The new uniform scale factor
   */
  public setScaleUniform(value: number): this {
    this.scale.x = value
    this.scale.y = value
    this.scale.z = value
    this.dirty = true
    return this
  }

  /**
   * Applies the given scale factor on top of the current state and rises the `dirty` flag
   *
   * @param scale - The scale factor to apply
   */
  public scaleBy(scale: IVec3): this {
    this.scale.x *= scale.x
    this.scale.y *= scale.y
    this.scale.z *= scale.z
    this.dirty = true
    return this
  }

  /**
   * Applies the given scale factor on top of the current state and rises the `dirty` flag
   *
   * @param scale - The scale factor to apply
   */
  public scaleX(scale: number): this {
    this.scale.x *= scale
    this.dirty = true
    return this
  }

  /**
   * Applies the given scale factor on top of the current state and rises the `dirty` flag
   *
   * @param scale - The scale factor to apply
   */
  public scaleY(scale: number): this {
    this.scale.y *= scale
    this.dirty = true
    return this
  }

  /**
   * Applies the given scale factor on top of the current state and rises the `dirty` flag
   *
   * @param scale - The scale factor to apply
   */
  public scaleZ(scale: number): this {
    this.scale.z *= scale
    this.dirty = true
    return this
  }

  /**
   * Applies the given scale factor on top of the current state and rises the `dirty` flag
   *
   * @param scaleX - The x scale factor to apply
   * @param scaleY - The y scale factor to apply
   * @param scaleZ - The z scale factor to apply
   */
  public scaleXYZ(scaleX: number, scaleY: number, scaleZ: number): this {
    this.scale.x *= scaleX
    this.scale.y *= scaleY
    this.scale.z *= scaleZ
    this.dirty = true
    return this
  }

  /**
   * Applies the given scale factor on top of the current state and rises the `dirty` flag
   *
   * @param scale - The scale factor to apply
   */
  public scaleUniform(scale: number): this {
      this.scale.x *= scale
      this.scale.y *= scale
      this.scale.z *= scale
      this.dirty = true
      return this
  }

  /**
   * Sets the new position and rises the `dirty` flag
   *
   * @param position - The position to copy
   */
  public setPosition(position: IVec3): this {
    this.position.x = position.x
    this.position.y = position.y
    this.position.z = position.z
    this.dirty = true
    return this
  }

  /**
   * Sets the new position coordinate and rises the `dirty` flag
   *
   * @param x - The new x position
   */
  public setPositionX(x: number): this {
    this.position.x = x
    this.dirty = true
    return this
  }

  /**
   * Sets the new position coordinate and rises the `dirty` flag
   *
   * @param y - The new y position
   */
  public setPositionY(y: number): this {
    this.position.y = y
    this.dirty = true
    return this
  }

  /**
   * Sets the new position coordinate and rises the `dirty` flag
   *
   * @param z - The new z position
   */
  public setPositionZ(z: number): this {
    this.position.z = z
    this.dirty = true
    return this
  }

  /**
   * Sets the new position and rises the `dirty` flag
   *
   * @param x - The new x position
   * @param y - The new y position
   * @param z - The new z position
   */
  public setPositionXYZ(x: number, y: number, z: number): this {
    this.position.x = x
    this.position.y = y
    this.position.z = z
    this.dirty = true
    return this
  }

  /**
   * Translates the current position by the given amount and rises th `dirty` flag
   *
   * @param delta - The translation amount
   */
  public translate(delta: IVec3): this {
    this.position.x += delta.x
    this.position.y += delta.y
    this.position.z += delta.z
    this.dirty = true
    return this
  }

  /**
   * Translates the current position by the given amount and rises th `dirty` flag
   *
   * @param dx - The translation amount
   */
  public translateX(dx: number): this {
    this.position.x += dx
    this.dirty = true
    return this
  }

  /**
   * Translates the current position by the given amount and rises th `dirty` flag
   *
   * @param dy - The translation amount
   */
  public translateY(dy: number): this {
    this.position.y += dy
    this.dirty = true
    return this
  }

  /**
   * Translates the current position by the given amount and rises th `dirty` flag
   *
   * @param dz - The translation amount
   */
  public translateZ(dz: number): this {
    this.position.z += dz
    this.dirty = true
    return this
  }

  /**
   * Translates the current position by the given amount and rises th `dirty` flag
   *
   * @param dx - The translation amount in x direction
   * @param dy - The translation amount in y direction
   * @param dz - The translation amount in z direction
   */
  public translateXYZ(dx: number, dy: number, dz: number): this {
    this.position.x += dx
    this.position.y += dy
    this.position.z += dz
    this.dirty = true
    return this
  }

  public lookAt(v: IVec3, up?: IVec3): this {
    this.rotation.initFromMatrix(tempMat.initLookAt(this.position, v, up || Vec3.Up))
    this.dirty = true
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
