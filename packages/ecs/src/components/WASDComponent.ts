import { extend } from '@gglib/core'
import * as Input from '@gglib/input'
import { IVec3, Mat4, Quat, Vec3 } from '@gglib/math'
import { Component } from './../Component'
import { Entity } from './../Entity'
import { KeyboardComponent } from './KeyboardComponent'
import { MouseComponent } from './MouseComponent'
import { TransformComponent } from './TransformComponent'

/**
 * @public
 */
export class WASDComponent implements Component {
  public entity: Entity
  public enabled: boolean = true

  public yaw: number = 0
  public pitch: number = 0
  public targetYaw: number = 0
  public targetPitch: number = 0
  public turnSpeed: number = 0.5
  public moveSpeed: number = 10
  public runSpeed: number = 50
  public turnDamping: number = 0.25
  public moveDamping: number = 0.25

  private currentMoveSpeed: number = 0
  private currentTurnSpeed: number = 0
  private temp: Vec3 = Vec3.createZero()
  private direction: Vec3 = Vec3.createZero()
  private translation: Vec3 = Vec3.createZero()
  private rotation: Quat = Quat.createIdentity()

  public mouse: MouseComponent
  public keyboard: KeyboardComponent
  public transform: TransformComponent

  public setup() {
    this.mouse = this.entity.getService('root:Mouse')
    this.keyboard = this.entity.getService('root:Keyboard')
    this.transform = this.entity.getService('Transform')
  }

  public update(timeMs: number) {
    const timeSec = timeMs / 1000.0
    const keyboard = this.keyboard
    const mouse = this.mouse
    const trans = this.transform
    let speed = this.moveSpeed
    let targetSpeed = 0
    this.translation.init(0, 0, 0)

    if (keyboard.isPressed(Input.Keys.KeyW)) {
      trans.worldMat.getForward(this.direction)
      this.translation.add(this.direction)
      targetSpeed = speed
    }
    if (keyboard.isPressed(Input.Keys.KeyS)) {
      trans.worldMat.getBackward(this.direction)
      this.translation.add(this.direction)
      targetSpeed = speed
    }
    if (keyboard.isPressed(Input.Keys.KeyA)) {
      trans.worldMat.getLeft(this.direction)
      this.translation.add(this.direction)
      targetSpeed = speed
    }
    if (keyboard.isPressed(Input.Keys.KeyD)) {
      trans.worldMat.getRight(this.direction)
      this.translation.add(this.direction)
      targetSpeed = speed
    }
    if (keyboard.isPressed(Input.Keys.KeyQ)) {
      trans.worldMat.getDown(this.direction)
      this.translation.add(this.direction)
      targetSpeed = speed
    }
    if (keyboard.isPressed(Input.Keys.KeyE)) {
      trans.worldMat.getUp(this.direction)
      this.translation.add(this.direction)
      targetSpeed = speed
    }
    if (keyboard.isPressed(Input.Keys.ShiftLeft)) {
      targetSpeed = this.runSpeed
    }
    if (this.translation.lengthSquared() > 0) {
      this.translation.normalize()
    }
    if (targetSpeed !== 0) {
      this.temp.initFrom(this.translation)
    }

    this.currentMoveSpeed += (targetSpeed - this.currentMoveSpeed) * this.moveDamping
    this.currentMoveSpeed = ((this.currentMoveSpeed * 1000) || 0) / 1000
    if (this.currentMoveSpeed !== 0) {
      Vec3.multiplyScalar(this.temp, this.currentMoveSpeed * timeSec, this.translation)
      trans.translate(this.translation)
    }

    if (mouse.leftButtonIsPressed) {
      let mouseX = mouse.xDelta
      let mouseY = mouse.yDelta

      if (mouseX !== 0 || mouseY !== 0) {
        speed = this.turnSpeed * timeSec
        this.targetYaw += mouseX * -speed
        this.targetPitch += mouseY * -speed
      }
    }

    this.yaw += (this.targetYaw - this.yaw) * this.turnDamping
    this.pitch += (this.targetPitch - this.pitch) * this.turnDamping
    this.rotation.initYawPitchRoll(this.yaw, this.pitch, 0)
    trans.rotation.initFrom(this.rotation)
    trans.dirty = true
  }
}
