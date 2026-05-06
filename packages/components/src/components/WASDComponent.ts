import { type GameComponent, GameEntity, InitializableComponent } from '@gglib/ecs'
import { KeyboardKey } from '@gglib/input'
import { Vec3 } from '@gglib/math'
import { BehaviorComponent } from '../systems/BehaviorSystem'
import { KeyboardInputSystem } from '../systems/KeyboardInput'
import { MouseInputSystem } from '../systems/MouseInput'
import type { TransformComponent } from './TransformComponent'

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

const FORWARD = new Vec3(0, 0, -1)
const BACKWARD = new Vec3(0, 0, 1)
const LEFT = new Vec3(-1, 0, 0)
const RIGHT = new Vec3(1, 0, 0)
const UP = new Vec3(0, 1, 0)
const DOWN = new Vec3(0, -1, 0)

export class WASDComponent implements GameComponent, InitializableComponent, BehaviorComponent {
  /**
   * Default movement speed in units per second
   */
  public moveSpeed: number = 5
  public moveSpeedStep: number = 1
  public moveSpeedMin: number = 1
  public moveSpeedMax: number = 20
  /**
   * Movement speed multiplier when `SHIFT` is pressed
   */
  public moveSpeedMultiplier: number = 10
  /**
   * Mouse sensitivity
   */
  public sensitivity: number = 1

  /**
   * Damping factor of the turn movement
   */
  public turnDamping: number = 0.1
  /**
   * Damping factor of the translation movement
   */
  public moveDamping: number = 0.1

  private yaw: number = 0
  private pitch: number = 0
  private targetYaw: number = 0
  private targetPitch: number = 0
  private startX: number = 0
  private startY: number = 0
  private startYaw: number = 0
  private startPitch: number = 0
  private isMouseDown: boolean = false

  private currentSpeed: number = 0
  private direction = new Vec3(0, 0, 0)
  private translation = new Vec3(0, 0, 0)

  private keyForwad: KeyboardKey = KeyboardKey.KeyW
  private keyBackward: KeyboardKey = KeyboardKey.KeyS
  private keyLeft: KeyboardKey = KeyboardKey.KeyA
  private keyRight: KeyboardKey = KeyboardKey.KeyD
  private keyUp: KeyboardKey = KeyboardKey.KeyE
  private keyDown: KeyboardKey = KeyboardKey.KeyQ
  private keyBoost: KeyboardKey = KeyboardKey.ShiftLeft
  private mouseButton: number = 0

  private mouse: MouseInputSystem
  private keyboard: KeyboardInputSystem
  public readonly entity: GameEntity

  public initialize(): void {
    this.mouse = this.entity.service(MouseInputSystem)
    this.keyboard = this.entity.service(KeyboardInputSystem)
  }

  public destroy(): void {
    //
  }

  /**
   * Checks the input and updates movement
   *
   * @param dt - Elapsed time since last frame
   */
  public updateBehavior(time: number, dt: number) {
    if (!this.entity.isActive) {
      return
    }
    const keyboard = this.keyboard
    const mouse = this.mouse
    const node = this.entity.getTransform<TransformComponent>()

    if (keyboard.isPressed(KeyboardKey.AltLeft) || keyboard.isPressed(KeyboardKey.AltRight)) {
      if (mouse.wheelDelta < 0) {
        this.moveSpeed += this.moveSpeedStep
      }
      if (mouse.wheelDelta > 0) {
        this.moveSpeed -= this.moveSpeedStep
      }
    }
    this.moveSpeed = Math.min(this.moveSpeedMax, Math.max(this.moveSpeedMin, this.moveSpeed))

    let isMoving = false
    this.translation.init(0, 0, 0)
    if (keyboard.isPressed(this.keyForwad)) {
      this.translation.add(FORWARD)
      isMoving = true
    }
    if (keyboard.isPressed(this.keyBackward)) {
      this.translation.add(BACKWARD)
      isMoving = true
    }
    if (keyboard.isPressed(this.keyLeft)) {
      this.translation.add(LEFT)
      isMoving = true
    }
    if (keyboard.isPressed(this.keyRight)) {
      this.translation.add(RIGHT)
      isMoving = true
    }
    if (keyboard.isPressed(this.keyDown)) {
      this.translation.add(DOWN)
      isMoving = true
    }
    if (keyboard.isPressed(this.keyUp)) {
      this.translation.add(UP)
      isMoving = true
    }
    if (this.translation.lengthSquared() > 0) {
      node.world.transformV3Normal(this.translation, this.direction)
    }

    const boost = keyboard.isPressed(this.keyBoost) ? this.moveSpeedMultiplier : 1
    const targetSpeed = isMoving ? this.moveSpeed * boost : 0

    this.currentSpeed += (targetSpeed - this.currentSpeed) * this.moveDamping
    if (Math.abs(this.currentSpeed) > Number.EPSILON) {
      node.translate(
        this.direction.x * this.currentSpeed * (dt / 1000),
        this.direction.y * this.currentSpeed * (dt / 1000),
        this.direction.z * this.currentSpeed * (dt / 1000),
      )
    } else {
      this.currentSpeed = 0
    }

    const isMouseDown =
      (this.mouseButton === 0 && mouse.leftButtonIsPressed) || (this.mouseButton !== 0 && mouse.rightButtonIsPressed)
    if (!this.isMouseDown && isMouseDown) {
      this.startX = mouse.xNormalized
      this.startY = mouse.yNormalized
      this.startYaw = this.yaw
      this.startPitch = this.pitch
    }
    if (isMouseDown) {
      this.targetYaw = this.startYaw + (this.startX - mouse.xNormalized) * this.sensitivity * Math.PI * 2
      this.targetPitch = this.startPitch + (this.startY - mouse.yNormalized) * this.sensitivity * Math.PI * 2
    }
    this.isMouseDown = isMouseDown

    this.yaw += (this.targetYaw - this.yaw) * this.turnDamping
    this.pitch += (this.targetPitch - this.pitch) * this.turnDamping

    node.rotation.initYawPitchRoll(this.yaw, this.pitch, 0)
    node.markAsChanged()
    node.updateIfNeeded()
  }
}
