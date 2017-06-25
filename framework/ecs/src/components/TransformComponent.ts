import { extend } from '@glib/core'
import { IVec3, Mat4, Quat, Vec3 } from '@glib/math'
import { Component } from './../Component'
import { Entity } from './../Entity'

export interface TransformProperties {
  position?: Vec3
  rotation?: Quat
  scale?: Vec3
}

export class TransformComponent implements Component {
  public name: string = 'Transform'
  public service: boolean = true
  public enabled: boolean = true

  public scale = Vec3.one()
  public position: Vec3 = Vec3.zero()
  public rotation: Quat = Quat.identity()
  public worldMat: Mat4 = Mat4.identity()
  public inverseMat: Mat4 = Mat4.identity()

  public tempQuat = Quat.identity()
  public tempMat = Mat4.identity()
  public tempVec = Vec3.zero()
  public dirty = true

  constructor(params?: TransformProperties) {
    if (params) {
      extend(this, params)
    }
    this.scale = Vec3.convert(this.scale || Vec3.one())
    this.position = Vec3.convert(this.position || Vec3.zero())
    this.rotation = Quat.convert(this.rotation || Quat.identity())
  }

  public update() {
    if (this.dirty) {
      this.worldMat
        .initIdentity()
        .setScale(this.scale)
        .multiply(this.tempMat.initFromQuaternion(this.rotation))
        .setTranslation(this.position)
      this.inverseMat
        .initFrom(this.worldMat)
        .invert()
      this.dirty = false
    }
  }

  public setRotation(quaternion: Quat): TransformComponent {
    this.rotation.initFrom(quaternion)
    this.dirty = true
    return this
  }

  public setRotationAxisAngle(axis: IVec3, angle: number): TransformComponent {
    this.rotation.initAxisAngle(axis, angle)
    this.dirty = true
    return this
  }

  public setRotationXYZAngle(x: number, y: number, z: number, angle: number): TransformComponent {
    this.rotation.initAxisAngle(this.tempVec.init(x, y, z).normalize(), angle)
    this.dirty = true
    return this
  }

  public setRotationYawPitchRoll(yaw: number, pitch: number, roll: number): TransformComponent {
    this.rotation.initYawPitchRoll(yaw, pitch, roll)
    this.dirty = true
    return this
  }

  public rotateAxisAngle(axis: IVec3, angle: number): TransformComponent {
    this.rotation.concat(this.tempQuat.initAxisAngle(axis, angle))
    this.dirty = true
    return this
  }

  public rotateXYZAngle(x: number, y: number, z: number, angle: number): TransformComponent {
    this.rotation.multiply(this.tempQuat.initAxisAngle(this.tempVec.init(x, y, z), angle))
    this.dirty = true
    return this
  }

  public rotateYawPitchRoll(yaw: number, pitch: number, roll: number): TransformComponent {
    this.rotation.concat(this.tempQuat.initYawPitchRoll(yaw, pitch, roll))
    this.dirty = true
    return this
  }

  public setScale(scale: IVec3): TransformComponent {
    this.scale.x = scale.x
    this.scale.y = scale.y
    this.scale.z = scale.z
    this.dirty = true
    return this
  }

  public setScaleXYZ(scaleX: number, scaleY: number, scaleZ: number): TransformComponent {
    this.scale.x = scaleX
    this.scale.y = scaleY
    this.scale.z = scaleZ
    this.dirty = true
    return this
  }

  public scaleBy(scale: IVec3): TransformComponent {
    this.scale.x *= scale.x
    this.scale.y *= scale.y
    this.scale.z *= scale.z
    this.dirty = true
    return this
  }

  public scaleXYZ(scaleX: number, scaleY: number, scaleZ: number): TransformComponent {
    this.scale.x *= scaleX
    this.scale.y *= scaleY
    this.scale.z *= scaleZ
    this.dirty = true
    return this
  }

  public scaleUniform(scale: number): TransformComponent {
      this.scale.x = scale
      this.scale.y = scale
      this.scale.z = scale
      this.dirty = true
      return this
  }

  public setScaleUniform(value: number): TransformComponent {
    this.scale.x = value
    this.scale.y = value
    this.scale.z = value
    this.dirty = true
    return this
  }

  public setPosition(position: IVec3): TransformComponent {
    this.position.x = position.x
    this.position.y = position.y
    this.position.z = position.z
    this.dirty = true
    return this
  }

  public setPositionXYZ(x: number, y: number, z: number): TransformComponent {
    this.position.x = x
    this.position.y = y
    this.position.z = z
    this.dirty = true
    return this
  }

  public translate(vec: IVec3): TransformComponent {
    this.position.x += vec.x
    this.position.y += vec.y
    this.position.z += vec.z
    this.dirty = true
    return this
  }

  public translateXYZ(x: number, y: number, z: number): TransformComponent {
    this.position.x += x
    this.position.y += y
    this.position.z += z
    this.dirty = true
    return this
  }

  public debug(): string {
    return [
      `- component: ${this.name}`,
      `  enabled  : ${this.enabled}`,
      `  world    :`,
      Mat4.format(this.worldMat),
    ].join('\n')
  }
}
