import { type GameComponent, GameEntity, InitializableComponent } from '@gglib/ecs'
import { KeyboardKey } from '@gglib/input'
import { Quat, SpaceBasis, Vec3 } from '@gglib/math'
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

  public radiusMin: number = 0.001
  public radiusMax: number = Number.POSITIVE_INFINITY
  public orbitMode: boolean = false
  public orbitCenter: Vec3 = new Vec3(0, 0, 0)

  private horizontal: number = 0
  private vertical: number = 0
  private radius: number = 1
  public targetHorizontal: number = 0
  public targetVertical: number = 0
  public targetRadius: number = 1

  private startX: number = 0
  private startY: number = 0
  private startHorizontal: number = 0
  private startVertical: number = 0
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

  private space: SpaceBasis
  private mouse: MouseInputSystem
  private keyboard: KeyboardInputSystem

  public readonly entity: GameEntity

  public initialize(): void {
    this.space = this.entity.service(SpaceBasis)
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

    this.updateMouseInput()
    this.updateCamera(dt)
  }

  private updateMouseInput() {
    const keyboard = this.keyboard
    const mouse = this.mouse

    if (keyboard.isPressed(KeyboardKey.AltLeft) || keyboard.isPressed(KeyboardKey.AltRight)) {
      if (mouse.wheelDelta < 0) {
        this.moveSpeed += this.moveSpeedStep
      }
      if (mouse.wheelDelta > 0) {
        this.moveSpeed -= this.moveSpeedStep
      }
    }
    if (!keyboard.isPressed(KeyboardKey.AltLeft) && !keyboard.isPressed(KeyboardKey.AltRight)) {
      if (mouse.wheelDelta != 0) {
        this.targetRadius *= Math.pow(0.95, -mouse.wheelDelta)
      }
    }
    this.targetRadius = Math.min(this.radiusMax, Math.max(this.radiusMin, this.targetRadius))
    this.moveSpeed = Math.min(this.moveSpeedMax, Math.max(this.moveSpeedMin, this.moveSpeed))

    const isMouseDown =
      (this.mouseButton === 0 && mouse.leftButtonIsPressed) || (this.mouseButton !== 0 && mouse.rightButtonIsPressed)

    if (!this.isMouseDown && isMouseDown) {
      this.startX = mouse.xNormalized
      this.startY = mouse.yNormalized
      this.startHorizontal = this.horizontal
      this.startVertical = this.vertical
    }
    if (isMouseDown) {
      this.targetHorizontal = this.startHorizontal + (this.startX - mouse.xNormalized) * this.sensitivity * Math.PI * 2
      this.targetVertical = this.startVertical + (this.startY - mouse.yNormalized) * this.sensitivity * Math.PI * 2
    }
    this.isMouseDown = isMouseDown

    this.horizontal += (this.targetHorizontal - this.horizontal) * this.turnDamping
    this.vertical += (this.targetVertical - this.vertical) * this.turnDamping
    this.radius += (this.targetRadius - this.radius) * this.moveDamping
  }

  private updateCamera(dt: number) {
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
      this.translation.add(this.space.forward)
      isMoving = true
    }
    if (keyboard.isPressed(this.keyBackward)) {
      this.translation.add(this.space.backward)
      isMoving = true
    }
    if (keyboard.isPressed(this.keyRight)) {
      this.translation.add(this.space.right)
      isMoving = true
    }
    if (keyboard.isPressed(this.keyLeft)) {
      this.translation.add(this.space.left)
      isMoving = true
    }
    if (keyboard.isPressed(this.keyUp)) {
      this.translation.add(this.space.up)
      isMoving = true
    }
    if (keyboard.isPressed(this.keyDown)) {
      this.translation.add(this.space.down)
      isMoving = true
    }
    if (this.translation.lengthSquared() > 0) {
      node.world.transformV3Normal(this.translation, this.direction)
    }

    const boost = keyboard.isPressed(this.keyBoost) ? this.moveSpeedMultiplier : 1
    const targetSpeed = isMoving ? this.moveSpeed * boost : 0
    this.currentSpeed += (targetSpeed - this.currentSpeed) * this.moveDamping

    if (this.orbitMode) {
      this.updateOrbit(dt)
    } else {
      this.updateFree(dt)
    }
  }

  private updateFree(dt: number) {
    const node = this.entity.getTransform<TransformComponent>()
    if (Math.abs(this.currentSpeed) > Number.EPSILON) {
      node.translate(
        this.direction.x * this.currentSpeed * (dt / 1000),
        this.direction.y * this.currentSpeed * (dt / 1000),
        this.direction.z * this.currentSpeed * (dt / 1000),
      )
    } else {
      this.currentSpeed = 0
    }

    node.rotation
      .initIdentity()
      .multiply(Quat.$1.initAxisAngle(this.space.up, this.horizontal))
      .multiply(Quat.$1.initAxisAngle(this.space.right, this.vertical))

    node.markAsChanged()
    node.updateIfNeeded()
  }

  private updateOrbit(dt: number) {
    this.orbitCenter.addXYZ(
      this.direction.x * this.currentSpeed * (dt / 1000),
      this.direction.y * this.currentSpeed * (dt / 1000),
      this.direction.z * this.currentSpeed * (dt / 1000),
    )

    const cosV = Math.cos(this.vertical)
    const sinV = Math.sin(this.vertical)
    const cosH = Math.cos(-this.horizontal)
    const sinH = Math.sin(-this.horizontal)

    const rx = this.space.right.x * sinH + this.space.forward.x * cosH
    const ry = this.space.right.y * sinH + this.space.forward.y * cosH
    const rz = this.space.right.z * sinH + this.space.forward.z * cosH

    const lookX = rx * cosV + this.space.up.x * sinV
    const lookY = ry * cosV + this.space.up.y * sinV
    const lookZ = rz * cosV + this.space.up.z * sinV

    Vec3.$0.init(
      this.orbitCenter.x - lookX * this.radius,
      this.orbitCenter.y - lookY * this.radius,
      this.orbitCenter.z - lookZ * this.radius,
    )

    const node = this.entity.getTransform<TransformComponent>()
    node.parent.worldInverse.transformV3(Vec3.$0)
    node.setPositionV(Vec3.$0)

    node.rotation
      .initIdentity()
      .multiply(Quat.$1.initAxisAngle(this.space.up, this.horizontal))
      .multiply(Quat.$1.initAxisAngle(this.space.right, this.vertical))

    node.markAsChanged()
    node.updateIfNeeded()
  }

  public setRotation(horizontal: number, vertical: number) {
    this.targetHorizontal = horizontal
    this.targetVertical = vertical

    this.horizontal = horizontal
    this.vertical = vertical

    const node = this.entity.getTransform<TransformComponent>()

    node.rotation
      .initIdentity()
      .multiply(Quat.$1.initAxisAngle(this.space.up, this.horizontal))
      .multiply(Quat.$1.initAxisAngle(this.space.right, this.vertical))

    node.markAsChanged()
    node.updateIfNeeded()
  }

  public getRotationHorizontal() {
    return this.horizontal
  }
}
