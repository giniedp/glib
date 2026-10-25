import { GameSystem, GameWorld, SystemOrder } from '@gglib/ecs'
import { type IVec2, type IVec3, type IVec4, easeLinear } from '@gglib/math'
import { type Clock, TimeSystem } from './TimeSystem'

/**
 * A value that can be tweened. Missing vector components are treated as `0`
 *
 * @public
 */
export type TweenValue = number | IVec2 | IVec3 | IVec4

/**
 * @public
 */
export type TweenCallback = (tween: Tween) => void

/**
 * Options for {@link Tween}
 *
 * @public
 */
export interface TweenOptions {
  /**
   * The start value
   */
  from?: TweenValue
  /**
   * The end value
   */
  to?: TweenValue
  /**
   * Duration of one cycle in seconds. Defaults to `0.5`
   */
  duration?: number
  /**
   * Delay in seconds before the first cycle starts
   */
  delay?: number
  /**
   * The ease function. Defaults to {@link easeLinear}
   */
  ease?: (t: number) => number
  /**
   * Number of additional cycles. Use `Infinity` to repeat forever
   */
  repeat?: number
  /**
   * Whether each cycle runs to the end value and back. Doubles the length of a cycle
   */
  yoyo?: boolean
  /**
   * The clock that drives this tween. Defaults to the game clock of the {@link TimeSystem}
   */
  clock?: Clock
  /**
   * Called every time the values have been updated
   */
  onUpdate?: TweenCallback
  /**
   * Called once the tween has finished
   */
  onComplete?: TweenCallback
}

const enum TweenState {
  Idle = 0,
  Playing = 1,
  Paused = 2,
}

/**
 * Interpolates up to four values from a start to an end value over time
 *
 * @public
 * @remarks
 * A tween is a flat object without nested allocations. Scalars use `x` (or `value`),
 * vectors use `x`, `y`, `z` and `w`. Since the tween implements `IVec4` it can be passed
 * directly to any function that accepts a vector, e.g. `transform.setPositionV(tween)`.
 *
 * A tween is reusable. Change `from`, `to` or any option and call {@link Tween.play} again.
 */
export class Tween implements IVec4 {
  /**
   * The current x value
   */
  public x = 0
  /**
   * The current y value
   */
  public y = 0
  /**
   * The current z value
   */
  public z = 0
  /**
   * The current w value
   */
  public w = 0

  public fromX = 0
  public fromY = 0
  public fromZ = 0
  public fromW = 0

  public toX = 0
  public toY = 0
  public toZ = 0
  public toW = 0

  /**
   * Duration of one cycle in seconds
   */
  public duration = 0.5
  /**
   * Delay in seconds before the first cycle starts
   */
  public delay = 0
  /**
   * The ease function
   */
  public ease: (t: number) => number = easeLinear
  /**
   * Number of additional cycles. Use `Infinity` to repeat forever
   */
  public repeat = 0
  /**
   * Whether each cycle runs to the end value and back. Doubles the length of a cycle
   */
  public yoyo = false
  /**
   * The clock that drives this tween. If not set, the system decides
   */
  public clock: Clock | null = null
  /**
   * Called every time the values have been updated
   */
  public onUpdate: TweenCallback | null = null
  /**
   * Called once the tween has finished
   */
  public onComplete: TweenCallback | null = null

  /**
   * Time in seconds since {@link Tween.play}, excluding the delay
   */
  public elapsed = 0
  /**
   * Linear progress of the current cycle in range [0:1], already reversed for yoyo cycles
   */
  public progress = 0

  /**
   * The current value (same as `x`)
   */
  public get value() {
    return this.x
  }

  public get isPlaying() {
    return this.state === TweenState.Playing
  }

  public get isPaused() {
    return this.state === TweenState.Paused
  }

  /**
   * Whether the tween is neither playing nor paused
   */
  public get isIdle() {
    return this.state === TweenState.Idle
  }

  private state = TweenState.Idle
  private system: TweenSystem | null
  /**
   * @internal whether this tween is in the list of the system
   */
  public queued = false

  public constructor(options?: TweenOptions, system?: TweenSystem) {
    this.system = system || null
    if (options) {
      this.set(options)
    }
  }

  /**
   * Applies the given options
   */
  public set(options: TweenOptions): this {
    if (options.from != null) this.setFrom(options.from)
    if (options.to != null) this.setTo(options.to)
    if (options.duration != null) this.duration = options.duration
    if (options.delay != null) this.delay = options.delay
    if (options.ease != null) this.ease = options.ease
    if (options.repeat != null) this.repeat = options.repeat
    if (options.yoyo != null) this.yoyo = options.yoyo
    if (options.clock !== undefined) this.clock = options.clock
    if (options.onUpdate !== undefined) this.onUpdate = options.onUpdate
    if (options.onComplete !== undefined) this.onComplete = options.onComplete
    return this
  }

  /**
   * Sets the start value
   */
  public setFrom(value: TweenValue): this {
    if (typeof value === 'number') {
      return this.setFromXYZW(value, 0, 0, 0)
    }
    return this.setFromXYZW(value.x, value.y, (value as IVec4).z ?? 0, (value as IVec4).w ?? 0)
  }

  /**
   * Sets the start value
   */
  public setFromXYZW(x: number, y = 0, z = 0, w = 0): this {
    this.fromX = x
    this.fromY = y
    this.fromZ = z
    this.fromW = w
    return this
  }

  /**
   * Sets the end value
   */
  public setTo(value: TweenValue): this {
    if (typeof value === 'number') {
      return this.setToXYZW(value, 0, 0, 0)
    }
    return this.setToXYZW(value.x, value.y, (value as IVec4).z ?? 0, (value as IVec4).w ?? 0)
  }

  /**
   * Sets the end value
   */
  public setToXYZW(x: number, y = 0, z = 0, w = 0): this {
    this.toX = x
    this.toY = y
    this.toZ = z
    this.toW = w
    return this
  }

  /**
   * Swaps the start and end values
   */
  public swap(): this {
    const { fromX, fromY, fromZ, fromW } = this
    return this.setFromXYZW(this.toX, this.toY, this.toZ, this.toW).setToXYZW(fromX, fromY, fromZ, fromW)
  }

  /**
   * Plays the tween from the beginning
   */
  public play(): this {
    this.elapsed = -this.delay
    this.progress = 0
    this.x = this.fromX
    this.y = this.fromY
    this.z = this.fromZ
    this.w = this.fromW
    this.state = TweenState.Playing
    if (this.system && !this.queued) {
      this.system.add(this)
    }
    return this
  }

  /**
   * Pauses a playing tween
   */
  public pause(): this {
    if (this.state === TweenState.Playing) {
      this.state = TweenState.Paused
    }
    return this
  }

  /**
   * Resumes a paused tween
   */
  public resume(): this {
    if (this.state === TweenState.Paused) {
      this.state = TweenState.Playing
    }
    return this
  }

  /**
   * Stops the tween at its current value without calling `onComplete`
   */
  public stop(): this {
    this.state = TweenState.Idle
    return this
  }

  /**
   * Jumps to the end value, calls `onUpdate` and `onComplete`
   */
  public finish(): this {
    if (this.state !== TweenState.Idle) {
      this.seek(Infinity)
    }
    return this
  }

  /**
   * Advances the tween by given time in seconds
   *
   * @remarks
   * Called by the {@link TweenSystem}. Call it manually for tweens that are not owned by a system.
   */
  public advance(dt: number): this {
    if (this.state === TweenState.Playing) {
      this.seek(this.elapsed + dt)
    }
    return this
  }

  private seek(elapsed: number) {
    this.elapsed = elapsed
    if (elapsed < 0) {
      return
    }
    // with yoyo every cycle is a round trip of two legs
    const cycles = (this.repeat + 1) * (this.yoyo ? 2 : 1)
    const duration = this.duration
    let cycle = duration > 0 ? Math.floor(elapsed / duration) : cycles
    let t = duration > 0 ? elapsed / duration - cycle : 1
    const done = cycle >= cycles
    if (done) {
      cycle = cycles - 1
      t = 1
    }
    if (this.yoyo && cycle % 2 === 1) {
      t = 1 - t
    }
    this.progress = t
    t = this.ease(t)
    this.x = this.fromX + (this.toX - this.fromX) * t
    this.y = this.fromY + (this.toY - this.fromY) * t
    this.z = this.fromZ + (this.toZ - this.fromZ) * t
    this.w = this.fromW + (this.toW - this.fromW) * t
    if (done) {
      this.state = TweenState.Idle
    }
    this.onUpdate?.(this)
    if (done) {
      this.onComplete?.(this)
    }
  }
}

/**
 * Advances all playing tweens once per update
 *
 * @public
 * @remarks
 * Tweens are driven by the game clock of the {@link TimeSystem}, or by their own `clock` if set.
 * Without a {@link TimeSystem} the delta time of the update is used.
 *
 * @example
 * ```ts
 * const tweens = world.getSystem(TweenSystem)
 * tweens.play({
 *   from: transform.translation,
 *   to: vec3(5, 0, 0),
 *   duration: 0.5,
 *   ease: easeOutCubic,
 *   onUpdate: (t) => transform.setPositionV(t),
 * })
 * ```
 */
export class TweenSystem extends GameSystem {
  public override order: number = SystemOrder.Time + 1

  protected tweens: Tween[] = []
  protected time: TimeSystem | null = null

  public initialize(world: GameWorld): void {
    this.time = world.getSystem(TimeSystem, { optional: true }) || null
  }

  public destroy(): void {
    this.stopAll()
  }

  /**
   * Creates an idle tween owned by this system. Call {@link Tween.play} to start it.
   */
  public create(options?: TweenOptions): Tween {
    return new Tween(options, this)
  }

  /**
   * Creates a tween and plays it
   */
  public play(options: TweenOptions): Tween {
    return this.create(options).play()
  }

  /**
   * Stops all tweens owned by this system
   */
  public stopAll(): this {
    for (const tween of this.tweens) {
      tween.stop()
    }
    return this
  }

  /**
   * @internal called by {@link Tween.play}
   */
  public add(tween: Tween) {
    tween.queued = true
    this.tweens.push(tween)
  }

  public override update(time: number, dt: number) {
    const fallback = this.time ? this.time.game.delta : dt
    const list = this.tweens
    // tweens that are played from within a callback are appended and kept for the next frame
    const count = list.length
    let n = 0
    for (let i = 0; i < count; i++) {
      const tween = list[i]
      tween.advance(tween.clock ? tween.clock.delta : fallback)
      if (tween.isIdle) {
        tween.queued = false
      } else {
        list[n++] = tween
      }
    }
    for (let i = count; i < list.length; i++) {
      list[n++] = list[i]
    }
    list.length = n
  }
}
