import { Component, OnUpdate, Inject } from '@gglib/ecs';
import { TimeComponent } from './TimeComponent';
import { IVec2, IVec3, Vec3, Vec2, IVec4, Vec4, easeLinear, clamp } from '@gglib/math';
import { isArray, Events, removeFromArray, addToArraySet } from '@gglib/utils';

export interface TweenOptions<T> {
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

export type TweenEventName = 'update'
export class Tween extends Events {

  public static EVENT_UPDATE: TweenEventName = 'update'

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

  public get progress() {
    return this.progressValue
  }

  private progressValue = 0
  constructor(options: TweenOptions<number[]>) {
    super()
    this.startTime = options.startTime || 0
    this.delayInMs = options.delayInMs || 0
    this.durationInMs = options.durationInMs || 500
    this.from = options.from
    this.to = options.to
    this.ease = options.ease || easeLinear
    if (!isArray(this.from) || !isArray(this.to)) {
      throw new Error(`from and to options must be arrays`)
    }
    if (this.from.length !== this.to.length) {
      throw new Error(`from and to must have equal length, but was from:${this.from.length} to:${this.to.length}`)
    }
    this.values = [...this.from]
  }

  /**
   * Interpolates values based on given time
   *
   * @param timeInMs - the current time in ms
   * @returns the progress valie in range [0:1]
   */
  public update(timeInMs: number) {
    this.progressValue = clamp((timeInMs - (this.startTime + this.delayInMs)) / this.durationInMs, 0, 1)
    const t = this.ease(this.progressValue)
    for (let i = 0; i < this.from.length; i++) {
      this.values[i] = (1 - t) * this.from[i] + t * this.to[i]
    }
    this.trigger(Tween.EVENT_UPDATE, this)
  }

  /**
   * Registers a callback function that is called on every update
   *
   * @param fn - the callback function
   */
  public onUpdateEvent(fn: (tween: Tween) => void) {
    return this.on(Tween.EVENT_UPDATE, fn)
  }
}

/**
 * Component that works off tween animations
 */
@Component()
export class TweenComponent implements OnUpdate {

  private tweens: Tween[] = []

  @Inject(TimeComponent, { from: 'root' })
  public readonly time: TimeComponent

  /**
   * Which clock should be used
   *
   * @remarks
   * if `null` the default game time is used
   */
  public clockName: string = null

  private get now() {
    const clock = this.clockName ? this.time.getOrCreate(this.clockName) : this.time.game
    return clock.totalMs
  }

  public onUpdate() {
    const clock = this.clockName ? this.time.getOrCreate(this.clockName) : this.time.game
    for (let i = 0; i < this.tweens.length; i++) {
      this.tweens[i]?.update(clock.totalMs)
    }
  }

  public cancelAll() {
    this.tweens.length = 0
  }

  public start(options: TweenOptions<number[]>) {
    return this.push({
      startTime: this.now,
      ...options,
    })
  }

  public startV2(options: TweenOptions<IVec2>) {
    return this.push({
      startTime: this.now,
      ...options,
      from: Vec2.toArray(options.from),
      to: Vec2.toArray(options.to),
    })
  }

  public startV3(options: TweenOptions<IVec3>) {
    return this.push({
      startTime: this.now,
      ...options,
      from: Vec3.toArray(options.from),
      to: Vec3.toArray(options.to),
    })
  }

  public startV4(options: TweenOptions<IVec4>) {
    return this.push({
      startTime: this.now,
      ...options,
      from: Vec4.toArray(options.from),
      to: Vec4.toArray(options.to),
    })
  }

  private push(options: TweenOptions<number[]>) {
    const tween = new Tween(options)
    this.tweens.push(tween)
    tween.onUpdateEvent((it) => {
      if (it. progress >= 1) {
        removeFromArray(this.tweens, tween)
      }
    })
    return tween
  }
}
