import { IVec3, Mat4, Quat, Vec3 } from '@gglib/math'
import { extend } from '@gglib/utils'
import { OnAdded, OnRemoved, OnUpdate } from './../Component'
import { Entity } from './../Entity'

/**
 * @public
 */
export interface TransformProperties {
  position?: Vec3
  rotation?: Quat
  scale?: Vec3
}

const tempQuat = Quat.createIdentity()
const tempMat = Mat4.createIdentity()
const tempVec = Vec3.createZero()

/**
 * @public
 */
export class TransformComponent implements OnAdded, OnRemoved, OnUpdate {

  public readonly scale = Vec3.createOne()
  public readonly position: Vec3 = Vec3.createZero()
  public readonly rotation: Quat = Quat.createIdentity()
  public readonly worldMat: Mat4 = Mat4.createIdentity()
  public readonly inverseMat: Mat4 = Mat4.createIdentity()

  public dirty = true

  constructor(params?: TransformProperties) {
    if (params) {
      extend(this, params)
    }
    this.scale = Vec3.convert(this.scale || Vec3.createOne())
    this.position = Vec3.convert(this.position || Vec3.createZero())
    this.rotation = Quat.convert(this.rotation || Quat.createIdentity())
  }

  public onAdded(entity: Entity) {
    entity.addService(TransformComponent, this)
  }

  public onRemoved(entity: Entity) {
    entity.removeService(TransformComponent)
  }

  public onUpdate() {
    if (this.dirty) {
      this.worldMat
        .initIdentity()
        .setScale(this.scale)
        .multiply(tempMat.initFromQuaternion(this.rotation))
        .setTranslation(this.position)
      this.inverseMat
        .initFrom(this.worldMat)
        .invert()
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

  public setScaleUniform(value: number): this {
    this.scale.x = value
    this.scale.y = value
    this.scale.z = value
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

  public translate(vec: IVec3): this {
    this.position.x += vec.x
    this.position.y += vec.y
    this.position.z += vec.z
    this.dirty = true
    return this
  }

  public translateXYZ(x: number, y: number, z: number): this {
    this.position.x += x
    this.position.y += y
    this.position.z += z
    this.dirty = true
    return this
  }
}
