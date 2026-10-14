import {
  type BehaviorComponent,
  KeyboardInputSystem,
  type TransformComponent,
  WASDComponent,
} from '@gglib/components'
import type { GameComponent, GameEntity } from '@gglib/ecs'
import { KeyboardKeys } from '@gglib/game'
import { vec3 } from '@gglib/math'
import { PLAYER_EYE_HEIGHT } from '../../constants'
import { CollisionSystem } from '../collision/CollisionSystem'
import { PlayerFlags, type PlayerResult } from '../collision/shared'

export type MovementMode = 'free' | 'grounded'

/**
 * Number of requests whose positions are remembered to correct them once their results arrive
 */
const HISTORY = 16

/**
 * Switches the camera between free flight and walking on the ground (key `G`)
 *
 * @remarks
 * Must be added after the {@link WASDComponent} of the same entity, it takes the horizontal displacement that
 * WASD applied this frame. In grounded mode the feet position is integrated here and sent to the collision worker,
 * results arrive asynchronously (usually within the same or the next frame) and are applied as a correction
 * relative to the request they belong to, so the main thread never waits for the worker.
 */
export class PlayerMovementComponent implements GameComponent, BehaviorComponent {
  public readonly entity: GameEntity

  public get mode(): MovementMode {
    return this._mode
  }

  private _mode: MovementMode = 'free'
  private wasd: WASDComponent
  private keyboard: KeyboardInputSystem
  private collision: CollisionSystem

  /**
   * Feet position, integrated from WASD displacement and corrected by worker results
   */
  private feet = vec3()
  /**
   * Camera position written in the previous frame, WASD displacement is measured against it
   */
  private camera = vec3()
  private teleportPending = true
  private result: PlayerResult = { x: 0, y: 0, z: 0 }
  private appliedSeq = 0
  private historySeq = new Int32Array(HISTORY)
  private historyPos = new Float64Array(HISTORY * 3)

  public initialize(): void {
    this.wasd = this.entity.component(WASDComponent)
    this.keyboard = this.entity.service(KeyboardInputSystem)
    this.collision = this.entity.service(CollisionSystem)
  }

  public setMode(mode: MovementMode) {
    if (mode === 'grounded' && !this.collision.player) {
      console.warn('grounded movement needs shared memory (cross origin isolation)')
      mode = 'free'
    }
    if (this._mode === mode) {
      return
    }
    this._mode = mode
    this.wasd.planar = mode === 'grounded'
    this.teleport()
  }

  /**
   * Takes the current camera position as is, call after moving the camera externally
   */
  public teleport() {
    this.teleportPending = true
  }

  public updateBehavior(time: number, dt: number): void {
    if (this.keyboard.justPressed(KeyboardKeys.KeyG)) {
      this.setMode(this._mode === 'free' ? 'grounded' : 'free')
    }
    if (this._mode !== 'grounded') {
      return
    }

    const player = this.collision.player
    const node = this.entity.getTransform<TransformComponent>()
    const position = node.translation
    let flags = PlayerFlags.Walls

    if (this.teleportPending) {
      this.teleportPending = false
      this.feet.x = position.x
      this.feet.y = position.y
      this.feet.z = position.z - PLAYER_EYE_HEIGHT
      this.historySeq.fill(0)
      this.appliedSeq = player.resolvedSequence
      flags |= PlayerFlags.Teleport
    } else {
      // correct the feet by the difference between a resolved request and what was requested
      const seq = player.readResult(this.result)
      if (seq && seq !== this.appliedSeq) {
        const slot = this.historySlot(seq)
        if (slot >= 0) {
          this.feet.x += this.result.x - this.historyPos[slot * 3 + 0]
          this.feet.y += this.result.y - this.historyPos[slot * 3 + 1]
          this.feet.z += this.result.z - this.historyPos[slot * 3 + 2]
        }
        this.appliedSeq = seq
      }
      // horizontal displacement applied by WASD this frame
      this.feet.x += position.x - this.camera.x
      this.feet.y += position.y - this.camera.y
    }

    const seq = player.request({ x: this.feet.x, y: this.feet.y, z: this.feet.z, dt, flags })
    const slot = seq & (HISTORY - 1)
    this.historySeq[slot] = seq
    this.historyPos[slot * 3 + 0] = this.feet.x
    this.historyPos[slot * 3 + 1] = this.feet.y
    this.historyPos[slot * 3 + 2] = this.feet.z

    this.camera.x = this.feet.x
    this.camera.y = this.feet.y
    this.camera.z = this.feet.z + PLAYER_EYE_HEIGHT
    node.setPosition(this.camera.x, this.camera.y, this.camera.z)
    node.updateIfNeeded()
  }

  private historySlot(seq: number) {
    const slot = seq & (HISTORY - 1)
    return this.historySeq[slot] === seq ? slot : -1
  }
}
