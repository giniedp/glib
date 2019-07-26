import { getTime, getOption } from '@gglib/utils'
import { OnDraw, OnUpdate } from '../Component'
import { Service } from '../decorators'

/**
 * Constructor options for {@link TimeComponent}
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
 * different compared to the realtime
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
   * The total accumulated game time in ms
   */
  public gameTimeTotalMs: number
  /**
   * The elapsed game time in ms since last update
   */
  public gameTimeElapsedMs: number
  /**
   * The elapsed real time in ms since last update
   */
  public realTimeElapsedMs: number
  /**
   * The total accumulated real time in ms
   */
  public realTimeTotalMs: number

  /**
   * Function returning a high precision timestamp
   */
  public getTime: () => number = getTime

  private resetAt: number
  private gameTimeUpdatedAt: number
  private gameTimeRenderedAt: number
  private realTimeUpdatedAt: number
  private realTimeRenderedAt: number

  constructor(options: TimeComponentOptions = {}) {
    this.getTime = getOption(options, 'getTime', getTime)
    this.reset()
  }

  /**
   * Resets the accumulated time values to `0`
   */
  public reset() {
    this.resetAt = this.getTime()

    this.realTimeUpdatedAt = 0
    this.realTimeRenderedAt = 0
    this.realTimeElapsedMs = 0
    this.realTimeTotalMs = 0

    this.gameTimeUpdatedAt = 0
    this.gameTimeRenderedAt = 0
    this.gameTimeElapsedMs = 0
    this.gameTimeTotalMs = 0
  }

  public onUpdate(ms: number) {
    const realTime = this.getTime()

    this.gameTimeElapsedMs = ms
    this.gameTimeTotalMs = this.gameTimeUpdatedAt + ms
    this.gameTimeUpdatedAt = this.gameTimeTotalMs

    this.realTimeElapsedMs = realTime - this.realTimeUpdatedAt
    this.realTimeTotalMs = realTime - this.resetAt
    this.realTimeUpdatedAt = realTime
  }

  public onDraw(ms: number) {
    const realTime = this.getTime()

    this.gameTimeElapsedMs = ms
    this.gameTimeTotalMs = this.gameTimeRenderedAt + ms
    this.gameTimeRenderedAt = this.gameTimeTotalMs

    this.realTimeElapsedMs = realTime - this.realTimeRenderedAt
    this.realTimeTotalMs = realTime - this.resetAt
    this.realTimeRenderedAt = realTime
  }
}
