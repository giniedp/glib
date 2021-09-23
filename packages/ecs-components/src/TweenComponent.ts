import { Component, OnUpdate, Inject } from '@gglib/ecs'
import { TimeComponent } from './TimeComponent'
import { IVec2, IVec3, Vec3, Vec2, IVec4, Vec4, easeLinear, clamp } from '@gglib/math'
import { isArray, Events, removeFromArray, FunctionPropertyNames, NonFunctionPropertyNames } from '@gglib/utils'

/**
 * Constructor options for {@link Tween}
 */
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

/**
 * Tween event names
 *
 * @public
 */
export type TweenEventName = 'update' | 'end' | 'start'

export class Tween extends Events {
  public static ON_START: TweenEventName = 'start'
  public static ON_UPDATE: TweenEventName = 'update'
  public static ON_END: TweenEventName = 'end'

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

  private activeValue = false
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
      this.trigger(Tween.ON_START, this)
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
    this.trigger(Tween.ON_UPDATE, this)
    if (!this.active) {
      this.trigger(Tween.ON_END, this)
    }
  }
  /**
   * Registers a callback function that is called when tween starts
   *
   * @param fn - the callback function
   */
  public whenStart(fn: (tween: Tween) => void) {
    return this.on(Tween.ON_START, fn)
  }

  /**
   * Registers a callback function that is called on every update
   *
   * @param fn - the callback function
   */
  public whenUpdate(fn: (tween: Tween) => void) {
    return this.on(Tween.ON_UPDATE, fn)
  }

  /**
   * Registers a callback function that is called when tween is finished
   *
   * @param fn - the callback function
   */
  public whenEnd(fn: (tween: Tween) => void) {
    return this.on(Tween.ON_END, fn)
  }

  public addUpdatable<T>(target: T, prop: NonFunctionPropertyNames<T>, index0 = 0) {
    this.whenUpdate((tween: Tween) => target[prop as any] = tween.values[index0])
  }

  public addUpdatableWith1Arg<T>(target: T, fun: FunctionPropertyNames<T>, index0 = 0) {
    this.whenUpdate((tween: Tween) => (target[fun] as any)(tween.values[index0]))
  }

  public addUpdatableWith2Args<T>(target: T, fun: FunctionPropertyNames<T>, index0 = 0, index1 = index0 + 1) {
    this.whenUpdate((tween: Tween) => (target[fun] as any)(tween.values[index0], tween.values[index1]))
  }

  public addUpdatableWith3Args<T>(
    target: T,
    fun: FunctionPropertyNames<T>,
    index0 = 0,
    index1 = index0 + 1,
    index2 = index0 + 2,
  ) {
    this.whenUpdate((tween: Tween) =>
      (target[fun] as any)(tween.values[index0], tween.values[index1], tween.values[index2]),
    )
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

  public cancelAll(): this {
    this.tweens.length = 0
    return this
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
    tween.whenEnd((it) => removeFromArray(this.tweens, tween))
    return tween
  }
}
