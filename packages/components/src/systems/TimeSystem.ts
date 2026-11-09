import { GameSystem, GameWorld, SystemOrder } from '@gglib/ecs'

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
  /**
   * Whether the clock is paused. A paused clock keeps its total, and its delta is `0`
   */
  paused: boolean
  /**
   * A fixed total in seconds, `null` lets the clock run. A fixed clock reports this total and a delta of `0` on each
   * tick, e.g. to compare frames of time dependent effects. When released, the clock continues from the fixed value.
   */
  fixed: number | null
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
  public override order: number = SystemOrder.Time

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
    paused: false,
    fixed: null,
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
   * Pauses a clock, the game clock by default. Its total stays, its delta is `0` until {@link TimeSystem.resume}
   */
  public pause(clock: GameTime = this.game) {
    clock.paused = true
  }

  /**
   * Resumes a paused clock, the game clock by default
   */
  public resume(clock: GameTime = this.game) {
    clock.paused = false
  }

  /**
   * Fixes the total of a clock (the game clock by default) to the given seconds, or lets it run again with `null`.
   *
   * @remarks
   * Everything that is driven by the clock shows the same state on every frame, e.g. for before/after comparisons of
   * time dependent effects. The clock applies the value on its next tick.
   */
  public setFixed(seconds: number | null, clock: GameTime = this.game) {
    clock.fixed = seconds
  }

  /**
   * Updates all clocks
   */
  public override update(time: number, dt: number) {
    this.time = time

    this.wall.delta = time - this.wall.updatedAt
    this.wall.total = time - this.resetAt
    this.wall.updatedAt = time

    tickUpdateClock(this.game, dt)
    for (const key in this.clocks) {
      tickUpdateClock(this.clocks[key], dt)
    }
  }

  /**
   * Updates all clocks
   */
  public override render(time: number, dt: number) {
    this.wall.delta = time - this.wall.renderedAt
    this.wall.total = time - this.resetAt
    this.wall.renderedAt = time

    tickRenderClock(this.game, dt)
    for (const key in this.clocks) {
      tickRenderClock(this.clocks[key], dt)
    }
  }
}

function tickUpdateClock(clock: GameTime, dt: number) {
  if (clock.fixed != null) {
    clock.updatedAt = clock.renderedAt = clock.fixed
  }
  clock.delta = clockDelta(clock, dt)
  clock.total = clock.updatedAt + clock.delta
  clock.updatedAt = clock.total
}

function tickRenderClock(clock: GameTime, dt: number) {
  if (clock.fixed != null) {
    clock.updatedAt = clock.renderedAt = clock.fixed
  }
  clock.delta = clockDelta(clock, dt)
  clock.total = clock.renderedAt + clock.delta
  clock.renderedAt = clock.total
}

function clockDelta(clock: GameTime, dt: number) {
  return clock.paused || clock.fixed != null ? 0 : dt * clock.factor
}
