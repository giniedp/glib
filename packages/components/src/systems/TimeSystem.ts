import { GameSystem, GameWorld } from '@gglib/ecs'

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

export class TimeSystem extends GameSystem {
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
  protected time: number = 0
  protected resetAt: number = 0

  public initialize(world: GameWorld): void {
    this.reset()
  }

  public destroy(): void {
    //
  }

  /**
   * Resets the accumulated time values to `0`
   */
  public reset() {
    this.resetAt = this.time
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
  public override update(time: number, dt: number) {
    this.time = time
    const realTime = time

    this.wall.elapsedMs = realTime - this.wall.updatedAt
    this.wall.totalMs = realTime - this.resetAt
    this.wall.updatedAt = realTime

    this.tickUpdateClick(this.game, dt * this.game.factor)
    for (const key in this.clocks) {
      const clock = this.clocks[key]
      this.tickUpdateClick(clock, dt * clock.factor)
    }
  }

  /**
   * Updates all clocks
   */
  public override render(time: number, dt: number) {
    const realTime = time

    this.wall.elapsedMs = realTime - this.wall.renderedAt
    this.wall.totalMs = realTime - this.resetAt
    this.wall.renderedAt = realTime

    this.tickRenderClock(this.game, dt * this.game.factor)
    for (const key in this.clocks) {
      const clock = this.clocks[key]
      this.tickRenderClock(clock, dt * clock.factor)
    }
  }

  private tickUpdateClick(clock: Clock, ms: number) {
    clock.elapsedMs = ms
    clock.totalMs = clock.updatedAt + ms
    clock.elapsed = clock.elapsedMs * 0.001
    clock.total = clock.totalMs * 0.001
    clock.updatedAt = clock.totalMs
  }

  private tickRenderClock(clock: Clock, ms: number) {
    clock.elapsedMs = ms
    clock.totalMs = clock.renderedAt + ms
    clock.elapsed = clock.elapsedMs * 0.001
    clock.total = clock.totalMs * 0.001
    clock.renderedAt = clock.totalMs
  }
}
