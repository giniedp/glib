import { GameSystem, GameWorld } from '@gglib/ecs'
import { type IVec2, type IVec3, type IVec4, Vec2, Vec3, Vec4, clamp, easeLinear } from '@gglib/math'
import { eventSource } from '@gglib/utils'
import { TimeSystem } from './TimeSystem'

/**
 * Constructor options for {@link Tween}
 */
export interface TweenOptions<T> {
  /**
   * The name of the clock to use.
   * If not set, the default game time will be used.
   */
  clockName?: string
  /**
   * The source values
   */
  from: T
  /**
   * The end values
   */
  to: T
  /**
   * The start time at which the tween starts
   */
  startTime?: number
  /**
   * The delay in ms when interpolation should start
   */
  delayInMs?: number
  /**
   * The duration of the animation (after delay)
   */
  durationInMs: number
  /**
   * The ease function
   */
  ease?: (t: number) => number
}

/**
 * Tween event names
 *
 * @public
 */
export type TweenEventName = 'update' | 'end' | 'start'

export class Tween implements IVec4 {
  /**
   * The name of the clock to use.
   * If not set, the default game time will be used.
   */
  public readonly clockName?: string
  /**
   * The time at which the tween has started
   */
  public readonly startTime: number
  /**
   * The delay in ms when interpolation should start
   */
  public readonly delayInMs: number
  /**
   * The duration of the animation (after delay)
   */
  public readonly durationInMs: number
  /**
   * The source values
   */
  public readonly from: ReadonlyArray<number>
  /**
   * The end values
   */
  public readonly to: ReadonlyArray<number>
  /**
   * The interpolated values
   */
  public readonly values: number[]
  /**
   * The ease function
   */
  public readonly ease: (t: number) => number
  /**
   * Whether this tween is active
   */
  public get active() {
    return this.activeValue
  }
  /**
   * The tween progress in range of [0:1]
   */
  public get progress() {
    return this.progressValue
  }

  /**
   * The current value of this tween (same as x for 1D tweens)
   */
  public get value() {
    return this.values[0]
  }

  /**
   * The current x value of this tween
   */
  public get x() {
    return this.values[0]
  }

  /**
   * The current y value of this tween
   */
  public get y() {
    return this.values[1]
  }

  /**
   * The current z value of this tween
   */
  public get z() {
    return this.values[2]
  }

  /**
   * The current w value of this tween
   */
  public get w() {
    return this.values[3]
  }

  public onStart = eventSource<Tween>()
  public onUpdate = eventSource<Tween>()
  public onEnd = eventSource<Tween>()

  private activeValue = false
  private progressValue = 0
  constructor(options: TweenOptions<number[]>) {
    this.clockName = options.clockName || null
    this.startTime = options.startTime || 0
    this.delayInMs = options.delayInMs || 0
    this.durationInMs = options.durationInMs || 500
    this.from = options.from
    this.to = options.to
    this.ease = options.ease || easeLinear
    if (!Array.isArray(this.from) || !Array.isArray(this.to)) {
      throw new Error(`from and to options must be arrays`)
    }
    if (this.from.length !== this.to.length) {
      throw new Error(`from and to must have equal length, but was from:${this.from.length} to:${this.to.length}`)
    }
    this.values = [...this.from]
  }

  /**
   * Restarts this tween
   */
  public restart() {
    this.progressValue = 0
  }

  /**
   * Interpolates values based on given time
   *
   * @param timeInMs - the current time in ms
   * @returns the progress valie in range [0:1]
   */
  public update(timeInMs: number) {
    if (!this.active && !this.progressValue) {
      this.activeValue = true
      this.progressValue = 0
      this.onStart.emit(this)
    }
    if (!this.active) {
      return
    }

    this.progressValue = clamp((timeInMs - (this.startTime + this.delayInMs)) / this.durationInMs, 0, 1)
    this.activeValue = this.progressValue < 1
    const t = this.ease(this.progressValue)
    for (let i = 0; i < this.from.length; i++) {
      this.values[i] = (1 - t) * this.from[i] + t * this.to[i]
    }
    this.onUpdate.emit(this)
    if (!this.active) {
      this.onEnd.emit(this)
    }
  }

  public bind(fn: (tween: Tween) => void) {
    this.onUpdate.add(fn)
  }

  public cancel() {
    this.onEnd.emit(this)
  }
}

/**
 * Component that works off tween animations
 */
export class TweenSystem extends GameSystem {
  public static removeItemSplice<T>(array: T[], item: T): void {
    const index = array.indexOf(item)
    if (index < 0) {
      return
    }
    array.splice(index, 1)
  }

  public static removeItemRemap<T>(array: T[], item: T): void {
    const index = array.indexOf(item)
    if (index < 0) {
      return
    }
    if (index < array.length - 1) {
      array[index] = array[array.length - 1]
    }
    array.length--
  }

  public static removeItem = TweenSystem.removeItemRemap

  protected tweens: Tween[] = []
  protected time: TimeSystem

  public initialize(game: GameWorld): void {
    this.time = game.getSystem(TimeSystem)
  }

  public override update() {
    for (const tween of this.tweens) {
      const clock = tween.clockName ? this.time.getOrCreate(tween.clockName) : this.time.game
      tween.update(clock.totalMs)
    }
  }

  public destroy(): void {
    //
  }

  public cancelAll(): this {
    this.tweens.length = 0
    return this
  }

  public start(options: TweenOptions<number[]>) {
    options.startTime = this.getClock(options.clockName).totalMs
    const tween = new Tween(options)
    this.tweens.push(tween)
    tween.onEnd.add(() => {
      TweenSystem.removeItem(this.tweens, tween)
    })
    return tween
  }

  public startScalar(options: TweenOptions<number>) {
    return this.start({
      ...options,
      from: [options.from],
      to: [options.to],
    })
  }

  public startV2(options: TweenOptions<IVec2>) {
    return this.start({
      ...options,
      from: Vec2.toArray(options.from),
      to: Vec2.toArray(options.to),
    })
  }

  public startV3(options: TweenOptions<IVec3>) {
    return this.start({
      ...options,
      from: Vec3.toArray(options.from),
      to: Vec3.toArray(options.to),
    })
  }

  public startV4(options: TweenOptions<IVec4>) {
    return this.start({
      ...options,
      from: Vec4.toArray(options.from),
      to: Vec4.toArray(options.to),
    })
  }

  private getClock(name: string) {
    return name ? this.time.getOrCreate(name) : this.time.game
  }
}
