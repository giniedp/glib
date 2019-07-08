import { IVec3, IVec4, Mat4, Quat, Vec3 } from '@gglib/math'
import { getOption } from '@gglib/utils'

import { Service } from '../decorators'
import { OnUpdate } from './../Component'

/**
 * Constructor options for {@link TransformComponent}
 *
 * @public
 */
export interface TransformComponentOptions {
  /**
   * The scale vector.
   */
  scale?: IVec3
  /**
   * The scale vector.
   */
  position?: IVec3
  /**
   * The rotation
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

  public readonly name = 'Transform'

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
   */
  public dirty: boolean

  constructor(options: TransformComponentOptions = {}) {
    this.scale = Vec3.convert(getOption(options, 'scale', Vec3.createOne()))
    this.position = Vec3.convert(getOption(options, 'position', Vec3.createZero()))
    this.rotation = Quat.convert(getOption(options, 'rotation', Quat.createIdentity()))
    this.dirty = true
  }

  public onUpdate() {
    if (this.dirty) {
      this.matrix
        .initIdentity()
        .setScale(this.scale)
        .multiply(tempMat.initFromQuaternion(this.rotation))
        .setTranslation(this.position)
      Mat4.invert(this.matrix, this.inverse)
      this.dirty = false
    }
  }

  public setRotation(quaternion: Quat): this {
    this.rotation.initFrom(quaternion)
    this.dirty = true
    return this
  }

  public setRotationAxisAngle(axis: IVec3, angle: number): this {
    this.rotation.initAxisAngle(axis, angle)
    this.dirty = true
    return this
  }

  public setRotationXYZAngle(x: number, y: number, z: number, angle: number): this {
    this.rotation.initAxisAngle(tempVec.init(x, y, z).normalize(), angle)
    this.dirty = true
    return this
  }

  public setRotationYawPitchRoll(yaw: number, pitch: number, roll: number): this {
    this.rotation.initYawPitchRoll(yaw, pitch, roll)
    this.dirty = true
    return this
  }

  public rotateAxisAngle(axis: IVec3, angle: number): this {
    this.rotation.concat(tempQuat.initAxisAngle(axis, angle))
    this.dirty = true
    return this
  }

  public rotateXYZAngle(x: number, y: number, z: number, angle: number): this {
    this.rotation.multiply(tempQuat.initAxisAngle(tempVec.init(x, y, z), angle))
    this.dirty = true
    return this
  }

  public rotateYawPitchRoll(yaw: number, pitch: number, roll: number): this {
    this.rotation.concat(tempQuat.initYawPitchRoll(yaw, pitch, roll))
    this.dirty = true
    return this
  }

  public setScale(scale: IVec3): this {
    this.scale.x = scale.x
    this.scale.y = scale.y
    this.scale.z = scale.z
    this.dirty = true
    return this
  }

  public setScaleXYZ(scaleX: number, scaleY: number, scaleZ: number): this {
    this.scale.x = scaleX
    this.scale.y = scaleY
    this.scale.z = scaleZ
    this.dirty = true
    return this
  }

  public setScaleUniform(value: number): this {
    this.scale.x = value
    this.scale.y = value
    this.scale.z = value
    this.dirty = true
    return this
  }

  public scaleBy(scale: IVec3): this {
    this.scale.x *= scale.x
    this.scale.y *= scale.y
    this.scale.z *= scale.z
    this.dirty = true
    return this
  }

  public scaleXYZ(scaleX: number, scaleY: number, scaleZ: number): this {
    this.scale.x *= scaleX
    this.scale.y *= scaleY
    this.scale.z *= scaleZ
    this.dirty = true
    return this
  }

  public scaleUniform(scale: number): this {
      this.scale.x *= scale
      this.scale.y *= scale
      this.scale.z *= scale
      this.dirty = true
      return this
  }

  public setPosition(position: IVec3): this {
    this.position.x = position.x
    this.position.y = position.y
    this.position.z = position.z
    this.dirty = true
    return this
  }

  public setPositionXYZ(x: number, y: number, z: number): this {
    this.position.x = x
    this.position.y = y
    this.position.z = z
    this.dirty = true
    return this
  }

  public translate(delta: IVec3): this {
    this.position.x += delta.x
    this.position.y += delta.y
    this.position.z += delta.z
    this.dirty = true
    return this
  }

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
}
