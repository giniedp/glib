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
  delta: number
  /**
   * The total accumulated time in seconds
   */
  total: number

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
  clock.delta = 0
  clock.total = 0
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
    delta: 0,
    total: 0,
    renderedAt: 0,
    updatedAt: 0,
  }

  /**
   * The game time clock
   */
  public readonly game: GameTime = {
    name: 'game',
    factor: 1,
    delta: 0,
    total: 0,
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

    this.wall.delta = time - this.wall.updatedAt
    this.wall.total = time - this.resetAt
    this.wall.updatedAt = time

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
    this.wall.delta = time - this.wall.renderedAt
    this.wall.total = time - this.resetAt
    this.wall.renderedAt = time

    this.tickRenderClock(this.game, dt * this.game.factor)
    for (const key in this.clocks) {
      const clock = this.clocks[key]
      this.tickRenderClock(clock, dt * clock.factor)
    }
  }

  private tickUpdateClick(clock: Clock, delta: number) {
    clock.delta = delta
    clock.total = clock.updatedAt + delta
    clock.updatedAt = clock.total
  }

  private tickRenderClock(clock: Clock, delta: number) {
    clock.delta = delta
    clock.total = clock.renderedAt + delta
    clock.renderedAt = clock.total
  }
}
