import { GameSystem, GameProvider } from '@gglib/ecs'
import { IVec2, IVec3, IVec4, Vec2, Vec3, Vec4, clamp, easeLinear } from '@gglib/math'
import { FunctionPropertyNames, NonFunctionPropertyNames, simpleObservable } from '@gglib/utils'
import { GameLoop } from './GameLoop'
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

export class Tween {
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

  public onStart = simpleObservable<Tween>()
  public onUpdate = simpleObservable<Tween>()
  public onEnd = simpleObservable<Tween>()

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
      this.onStart.notify(this)
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
    this.onUpdate.notify(this)
    if (!this.active) {
      this.onEnd.notify(this)
    }
  }

  public addUpdatable<T>(target: T, prop: NonFunctionPropertyNames<T>, index0 = 0) {
    target[prop as any] = this.values[index0]
    this.onUpdate.add((tween: Tween) => {
      target[prop as any] = tween.values[index0]
    })
  }

  public addUpdatableWith1Arg<T>(target: T, fun: FunctionPropertyNames<T>, index0 = 0) {
    this.onUpdate.add((tween: Tween) => {
      ;(target[fun] as any)(tween.values[index0])
    })
  }

  public addUpdatableWith2Args<T>(target: T, fun: FunctionPropertyNames<T>, index0 = 0, index1 = index0 + 1) {
    this.onUpdate.add((tween: Tween) => {
      ;(target[fun] as any)(tween.values[index0], tween.values[index1])
    })
  }

  public addUpdatableWith3Args<T>(
    target: T,
    fun: FunctionPropertyNames<T>,
    index0 = 0,
    index1 = index0 + 1,
    index2 = index0 + 2,
  ) {
    this.onUpdate.add((tween: Tween) => {
      ;(target[fun] as any)(tween.values[index0], tween.values[index1], tween.values[index2])
    })
  }
}

/**
 * Component that works off tween animations
 */
export class TweenSystem implements GameSystem {
  public static removeFromArraySplice<T>(array: T[], item: T): void {
    const index = array.indexOf(item)
    if (index < 0) {
      return
    }
    array.splice(index, 1)
  }

  public static removeFromArrayRemap<T>(array: T[], item: T): void {
    const index = array.indexOf(item)
    if (index < 0) {
      return
    }
    if (index < array.length - 1) {
      array[index] = array[array.length - 1]
    }
    array.length--
  }

  public static removeFromArray = TweenSystem.removeFromArrayRemap

  protected tweens: Tween[] = []
  protected time: TimeSystem
  protected loop: GameLoop

  public initialize(host: GameProvider): void {
    this.time = host.get(TimeSystem)
    this.loop = host.get(GameLoop)
    this.loop.onUpdate.add(this.update)
  }

  public destroy(): void {
    this.loop.onUpdate.remove(this.update)
  }

  public update = () => {
    for (const tween of this.tweens) {
      const clock = tween.clockName ? this.time.getOrCreate(tween.clockName) : this.time.game
      tween.update(clock.totalMs)
    }
  }

  public cancelAll(): this {
    this.tweens.length = 0
    return this
  }

  public start(options: TweenOptions<number[]>) {
    return this.push({
      startTime: this.getClock(options.clockName).totalMs,
      ...options,
    })
  }

  public startV2(options: TweenOptions<IVec2>) {
    return this.push({
      startTime: this.getClock(options.clockName).totalMs,
      ...options,
      from: Vec2.toArray(options.from),
      to: Vec2.toArray(options.to),
    })
  }

  public startV3(options: TweenOptions<IVec3>) {
    return this.push({
      startTime: this.getClock(options.clockName).totalMs,
      ...options,
      from: Vec3.toArray(options.from),
      to: Vec3.toArray(options.to),
    })
  }

  public startV4(options: TweenOptions<IVec4>) {
    return this.push({
      startTime: this.getClock(options.clockName).totalMs,
      ...options,
      from: Vec4.toArray(options.from),
      to: Vec4.toArray(options.to),
    })
  }

  private push(options: TweenOptions<number[]>) {
    const tween = new Tween(options)
    this.tweens.push(tween)
    tween.onEnd.add(() => {
      TweenSystem.removeFromArray(this.tweens, tween)
    })
    return tween
  }

  private getClock(name: string) {
    return name ? this.time.getOrCreate(name) : this.time.game
  }
}
