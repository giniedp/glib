import { Entity, Inject, OnUpdate, Component } from '@gglib/ecs'
import { KeyboardKey } from '@gglib/input'
import { Vec3 } from '@gglib/math'

import { getOption } from '@gglib/utils'
import { KeyboardComponent } from './KeyboardComponent'
import { MouseComponent } from './MouseComponent'
import { TransformComponent } from './TransformComponent'

/**
 * @public
 */
export interface WASDComponentOptions {
  keyForwad?: KeyboardKey
  keyBackward?: KeyboardKey
  keyLeft?: KeyboardKey
  keyRight?: KeyboardKey
  keyUp?: KeyboardKey
  keyDown?: KeyboardKey
  keyBoost?: KeyboardKey
  mouseButton?: number
}

/**
 * @public
 */
@Component({
  install: [
    MouseComponent,
    KeyboardComponent,
    TransformComponent,
  ]
})
export class WASDComponent implements OnUpdate {

  /**
   * Default movement speed in units per second
   */
  public moveSpeed: number = 5
  /**
   * Movement speed in units per second when `SHIFT` is pressed
   */
  public runSpeed: number = 50
  /**
   * Mouse sensitivity
   */
  public sensitivity: number = 0.5

  /**
   * Damping factor of the turn movement
   */
  public turnDamping: number = 0.25
  /**
   * Damping factor of the translation movement
   */
  public moveDamping: number = 0.25

  /**
   * The mouse component
   */
  @Inject(MouseComponent)
  public readonly mouse: MouseComponent

  /**
   * The keyboard component
   */
  @Inject(KeyboardComponent)
  public readonly keyboard: KeyboardComponent

  /**
   * The transform component
   */
  @Inject(TransformComponent)
  public readonly transform: TransformComponent

  private yaw: number = 0
  private pitch: number = 0
  private targetYaw: number = 0
  private targetPitch: number = 0

  private currentMoveSpeed: number = 0
  private temp: Vec3 = Vec3.createZero()
  private translation: Vec3 = Vec3.createZero()

  private keyForwad: KeyboardKey = KeyboardKey.KeyW
  private keyBackward: KeyboardKey = KeyboardKey.KeyS
  private keyLeft: KeyboardKey = KeyboardKey.KeyA
  private keyRight: KeyboardKey = KeyboardKey.KeyD
  private keyUp: KeyboardKey = KeyboardKey.KeyE
  private keyDown: KeyboardKey = KeyboardKey.KeyQ
  private keyBoost: KeyboardKey = KeyboardKey.ShiftLeft
  private mouseButton: number = 0

  public constructor(options: WASDComponentOptions = {}) {
    this.setup(options)
  }

  public setup(options: WASDComponentOptions) {
    this.keyForwad = getOption(options, 'keyForwad', this.keyForwad)
    this.keyBackward = getOption(options, 'keyBackward', this.keyBackward)
    this.keyLeft = getOption(options, 'keyLeft', this.keyLeft)
    this.keyRight = getOption(options, 'keyRight', this.keyRight)
    this.keyUp = getOption(options, 'keyUp', this.keyUp)
    this.keyDown = getOption(options, 'keyDown', this.keyDown)
    this.keyBoost = getOption(options, 'keyBoost', this.keyBoost)
    this.mouseButton = getOption(options, 'mouseButton', this.mouseButton)
  }

  /**
   * Checks the input and updates movement
   *
   * @param dt - Elapsed time since last frame
   */
  public onUpdate(dt: number) {
    const dtSec = dt / 1000.0
    const keyboard = this.keyboard
    const mouse = this.mouse
    const trans = this.transform
    let speed = this.moveSpeed
    let targetSpeed = 0
    this.translation.init(0, 0, 0)

    if (keyboard.isPressed(this.keyForwad)) {
      this.translation.add(Vec3.Forward)
    }
    if (keyboard.isPressed(this.keyBackward)) {
      this.translation.add(Vec3.Backward)
    }
    if (keyboard.isPressed(this.keyLeft)) {
      this.translation.add(Vec3.Left)
    }
    if (keyboard.isPressed(this.keyRight)) {
      this.translation.add(Vec3.Right)
    }
    if (keyboard.isPressed(this.keyDown)) {
      this.translation.add(Vec3.Down)
    }
    if (keyboard.isPressed(this.keyUp)) {
      this.translation.add(Vec3.Up)
    }
    if (this.translation.lengthSquared() > 0) {
      this.translation.transformByQuat(this.transform.rotation).normalize()

      if (keyboard.isPressed(this.keyBoost)) {
        targetSpeed = this.runSpeed
      } else {
        targetSpeed = speed
      }
    }
    if (targetSpeed !== 0) {
      this.temp.initFrom(this.translation)
    }

    this.currentMoveSpeed +=
      (targetSpeed - this.currentMoveSpeed) * this.moveDamping
    this.currentMoveSpeed = Math.floor(this.currentMoveSpeed * 1000) / 1000
    if (this.currentMoveSpeed !== 0) {
      Vec3.multiplyScalar(
        this.temp,
        this.currentMoveSpeed * dtSec,
        this.translation,
      )
      trans.translateV(this.translation)
    }

    if (
      (this.mouseButton === 0 && mouse.leftButtonIsPressed) ||
      (this.mouseButton !== 0 && mouse.rightButtonIsPressed)
    ) {
      let mouseX = mouse.dxNormalized
      let mouseY = mouse.dyNormalized

      if (mouseX !== 0 || mouseY !== 0) {
        speed = this.sensitivity * dt
        this.targetYaw += mouseX * -speed
        this.targetPitch += mouseY * -speed
      }
    }

    this.yaw += (this.targetYaw - this.yaw) * this.turnDamping
    this.pitch += (this.targetPitch - this.pitch) * this.turnDamping
    trans.setRotationYawPitchRoll(this.yaw, this.pitch, 0)
  }
}
