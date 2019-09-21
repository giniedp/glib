import { OnDraw, OnUpdate, Service } from '@gglib/ecs'
import { getOption, getTime } from '@gglib/utils'

/**
 * A timer object holding elapsed and accumulated time values
 *
 * @public
 */
export interface TimeClock {
  /**
   * Elapsed time in seconds since last call to update or draw
   */
  elapsed: number
  /**
   * The total accumulated time in seconds
   */
  total: number
  /**
   * Elapsed time in milliseconds since last call to update or draw
   */
  elapsedMs: number
  /**
   * The total accumulated time in milliseconds
   */
  totalMs: number

  /**
   * Reference time when update was called
   */
  updatedAt: number
  /**
   * Reference time when draw was called
   */
  renderedAt: number
}

/**
 * A named timer with a time scale factor
 *
 * @public
 */
export interface GameTime extends TimeClock {
  /**
   * The name or id of this clock
   */
  id: any
  /**
   * The scale factor of this clock
   */
  factor: number
}

function resetClock(clock: TimeClock) {
  clock.elapsed = 0
  clock.elapsedMs = 0
  clock.total = 0
  clock.totalMs = 0
}

/**
 * Constructor options for {@link TimeComponent}
 *
 * @public
 */
export interface TimeComponentOptions {
  /**
   * Function returning a high precision timestamp
   */
  getTime?: () => number
}

/**
 * A component that tracks the elapsed game and real time between frames.
 *
 * @public
 * @remarks
 * This component provides the elapsed game and real time between frames
 * as well as the total accumulated time.
 *
 * The game time is tracked by using the time delta that is passed to the
 * `onUpdate` and `ondDraw` methods. Depending on the implementation of
 * the loop scheduler (e.g. {@link LoopComponent}) this value may be
 * different compared to the realtime. Further the game time can be scaled
 * or paused.
 *
 * The real time is tracked by observing the wall clock time on each call
 * to `onUpdate` to `onDraw` methods.
 *
 * Depending on the implementation of the loop scheduler (e.g. {@link LoopComponent})
 * the calls to `onUpdate` and `onDraw` may be decoupled, meaning that they run at
 * different frequencies. The time values are tracked individually and
 * are recalculated on each call to `onUpdate` and `onDraw`.
 *
 * The ideal placement of this component is right after the loop scheduler
 * (e.g. {@link LoopComponent}) in the same {@link Entity.components} list.
 * For example:
 *
 * ```ts
 * Entity.createRoot()
 *   .addComponent(new LoopComponent())
 *   .addComponent(new TimeComponent())
 * ```
 */

@Service()
export class TimeComponent implements OnUpdate, OnDraw {

  /**
   * The real time clock
   */
  public readonly real: TimeClock = {
    elapsed: 0,
    elapsedMs: 0,
    total: 0,
    totalMs: 0,
    renderedAt: 0,
    updatedAt: 0,
  }
  /**
   * The default game time clock
   */
  public readonly game: GameTime = {
    id: 'game',
    factor: 1,
    elapsed: 0,
    elapsedMs: 0,
    total: 0,
    totalMs: 0,
    renderedAt: 0,
    updatedAt: 0,
  }

  /**
   * Function returning a high precision timestamp
   */
  public getTime: () => number = getTime

  private readonly clocks = new Map<any, GameTime>()
  private readonly clockIds: any[] = []

  protected resetAt: number
  constructor(options: TimeComponentOptions = {}) {
    this.getTime = getOption(options, 'getTime', getTime)
    this.reset()
  }

  /**
   * Resets the accumulated time values to `0`
   */
  public reset() {
    this.resetAt = this.getTime()
    resetClock(this.real)
    resetClock(this.game)
    for (let i = 0; i < this.clockIds.length; i++) {
      resetClock(this.clocks.get(this.clockIds[i]))
    }
  }

  /**
   * Gets an existing clock with given key
   */
  public get(key: string) {
    return this.clocks.get(key)
  }

  /**
   * Deletes an existing clock with given key
   */
  public delete(key: any) {
    if (this.clocks.has(key)) {
      this.clocks.delete(key)
      this.clockIds.splice(this.clockIds.indexOf(key), 1)
    }
  }

  /**
   * Deletes an existing clock with given key or creates a new one by cloning the current game time
   */
  public getOrCreate(key: any) {
    if (!this.clocks.has(key)) {
      this.clockIds.push(key)
      this.clocks.set(key, {
        ...this.game,
        id: key,
      })
    }
    return this.get(key)
  }

  /**
   * Updates all clocks
   *
   * @param ms - Elapsed time since last update
   */
  public onUpdate(ms: number) {
    const realTime = this.getTime()

    this.real.elapsedMs = realTime - this.real.updatedAt
    this.real.totalMs = realTime - this.resetAt
    this.real.updatedAt = realTime

    this.onUpdateClock(this.game, ms * this.game.factor)
    for (let i = 0; i < this.clockIds.length; i++) {
      const clock = this.clocks.get(this.clockIds[i])
      this.onUpdateClock(clock, ms * clock.factor)
    }
  }

  /**
   * Updates all clocks
   *
   * @param ms - Elapsed time since last draw
   */
  public onDraw(ms: number) {
    const realTime = this.getTime()

    this.real.elapsedMs = realTime - this.real.renderedAt
    this.real.totalMs = realTime - this.resetAt
    this.real.renderedAt = realTime

    this.onDrawClock(this.game, ms * this.game.factor)
    for (let i = 0; i < this.clockIds.length; i++) {
      const clock = this.clocks.get(this.clockIds[i])
      this.onDrawClock(clock, ms * clock.factor)
    }
  }

  private onUpdateClock(clock: TimeClock, ms: number) {
    clock.elapsedMs = ms
    clock.totalMs = clock.updatedAt + ms
    clock.elapsed = clock.elapsedMs * 0.001
    clock.total = clock.totalMs * 0.001
    clock.updatedAt = clock.totalMs
  }

  private onDrawClock(clock: TimeClock, ms: number) {
    clock.elapsedMs = ms
    clock.totalMs = clock.renderedAt + ms
    clock.elapsed = clock.elapsedMs * 0.001
    clock.total = clock.totalMs * 0.001
    clock.renderedAt = clock.totalMs
  }
}
