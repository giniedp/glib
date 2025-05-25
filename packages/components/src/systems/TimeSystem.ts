import { GameSystem, GameProvider } from '@gglib/ecs'
import { GameLoop, LoopTime } from './GameLoop'

/**
 * A timer object holding elapsed and accumulated time values
 *
 * @public
 */
export interface Clock {
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
export interface GameTime extends Clock {
  /**
   * The name or id of this clock
   */
  name: string
  /**
   * The scale factor of this clock
   */
  factor: number
}

function resetClock(clock: Clock) {
  clock.elapsed = 0
  clock.elapsedMs = 0
  clock.total = 0
  clock.totalMs = 0
}

/**
 * Constructor options for {@link TimeSystem}
 *
 * @public
 */
export interface TimeComponentOptions {
  //
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
 */

export class TimeSystem implements GameSystem {
  /**
   * The real time clock
   */
  public readonly wall: Clock = {
    elapsed: 0,
    elapsedMs: 0,
    total: 0,
    totalMs: 0,
    renderedAt: 0,
    updatedAt: 0,
  }

  /**
   * The game time clock
   */
  public readonly game: GameTime = {
    name: 'game',
    factor: 1,
    elapsed: 0,
    elapsedMs: 0,
    total: 0,
    totalMs: 0,
    renderedAt: 0,
    updatedAt: 0,
  }

  protected clocks: Record<string, GameTime> = {}
  protected loop: GameLoop
  protected resetAt: number

  constructor(options: TimeComponentOptions = {}) {}

  public initialize(game: GameProvider): void {
    this.loop = game.get(GameLoop)
    this.loop.onUpdate.add(this.onUpdate)
    this.loop.onDraw.add(this.onDraw)
    this.reset()
  }

  public destroy(): void {
    this.loop.onUpdate.remove(this.onUpdate)
    this.loop.onDraw.remove(this.onDraw)
  }

  /**
   * Resets the accumulated time values to `0`
   */
  public reset() {
    this.resetAt = this.loop.getTime()
    resetClock(this.wall)
    resetClock(this.game)
    for (const key in this.clocks) {
      resetClock(this.clocks[key])
    }
  }

  /**
   * Gets an existing clock with given key
   */
  public get(name: string) {
    const result = this.clocks[name]
    if (!result) {
      throw new Error(`Clock ${name} not found`)
    }
    return result
  }

  /**
   * Deletes an existing clock with given key
   */
  public delete(name: string) {
    delete this.clocks[name]
  }

  /**
   * Gets an existing clock with given key or creates a new one by cloning the current game time
   */
  public getOrCreate(name: string) {
    if (!(name in this.clocks)) {
      this.clocks[name] = {
        ...this.game,
        name: name,
      }
    }
    return this.get(name)
  }

  /**
   * Updates all clocks
   */
  public onUpdate = (time: LoopTime) => {
    const realTime = this.loop.getTime()

    this.wall.elapsedMs = realTime - this.wall.updatedAt
    this.wall.totalMs = realTime - this.resetAt
    this.wall.updatedAt = realTime

    const ms = time.deltaMs
    this.onUpdateClock(this.game, ms * this.game.factor)
    for (const key in this.clocks) {
      const clock = this.clocks[key]
      this.onUpdateClock(clock, ms * clock.factor)
    }
  }

  /**
   * Updates all clocks
   */
  public onDraw = (time: LoopTime) => {
    const realTime = this.loop.getTime()

    this.wall.elapsedMs = realTime - this.wall.renderedAt
    this.wall.totalMs = realTime - this.resetAt
    this.wall.renderedAt = realTime

    const ms = time.deltaMs
    this.onDrawClock(this.game, ms * this.game.factor)
    for (const key in this.clocks) {
      const clock = this.clocks[key]
      this.onDrawClock(clock, ms * clock.factor)
    }
  }

  private onUpdateClock(clock: Clock, ms: number) {
    clock.elapsedMs = ms
    clock.totalMs = clock.updatedAt + ms
    clock.elapsed = clock.elapsedMs * 0.001
    clock.total = clock.totalMs * 0.001
    clock.updatedAt = clock.totalMs
  }

  private onDrawClock(clock: Clock, ms: number) {
    clock.elapsedMs = ms
    clock.totalMs = clock.renderedAt + ms
    clock.elapsed = clock.elapsedMs * 0.001
    clock.total = clock.totalMs * 0.001
    clock.renderedAt = clock.totalMs
  }
}
