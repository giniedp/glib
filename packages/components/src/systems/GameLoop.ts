import { GameSystem, GameWorld } from '@gglib/ecs'
import { eventSource } from '@gglib/utils'

/**
 * Constructor options for the {@link GameLoop}
 *
 * @public
 */
export interface GameLoopOptions {
  /**
   * If set to true, the loop will start automatically when the service is initialized.
   */
  autostart?: boolean

  /**
   * Indicates whether fixed time step should be used. Default is `true`.
   */
  useFixedTimeStep?: boolean

  /**
   * The fixed time step to use for update logic
   *
   * @remarks
   * Only affects loops with `useFixedTimeStep` set to `true`
   */
  targetElapsedTime?: number

  /**
   * When time between frames gets too large it is limited to this value before it is used. Default is `500`.
   *
   * @remarks
   * Only affects loops with `useFixedTimeStep` set to `true`
   */
  maxElapsedTime?: number

  /**
   * Threshold value that determines when `isRunningSlowly` returns `true`
   *
   * @remarks
   * Only affects loops with `useFixedTimeStep` set to `true`
   */
  maxLaggingFrames?: number

  /**
   * A custom function as remplacement for {@link https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame}
   */
  requestAnimationFrame?: (fn: FrameRequestCallback) => number

  /**
   * A custom function as remplacement for {@link https://developer.mozilla.org/en-US/docs/Web/API/window/cancelAnimationFrame}
   */
  cancelAnimationFrame?: (id: number) => void

  /**
   * Function returning a high precision timestamp
   */
  getTime?: () => number
}

export interface LoopTimeParams {
  /**
   * The current frame number
   */
  frame: number

  /**
   * Total time since the start of the loop in milliseconds
   */
  timeMs: number

  /**
   * Time since last frame in milliseconds
   */
  deltaMs: number

  /**
   * Indicates that the loop is running slower than the target elapsed time
   */
  isRunningSlowly: boolean
}

export type LoopTime = Readonly<LoopTimeParams>

/**
 * @public
 */
export class GameLoop extends GameSystem {
  /**
   * Indicates whether fixed time step should be used. Default is `true`.
   */
  public useFixedTimeStep: boolean = false

  /**
   * The fixed time step to use for update logic
   *
   * @remarks
   * Only affects loops with `useFixedTimeStep` set to `true`
   */
  public targetElapsedTime: number = 1000 / 60

  /**
   * When time between frames gets too large it is limited to this value before it is used. Default is `500`.
   *
   * @remarks
   * Only affects loops with `useFixedTimeStep` set to `true`
   */
  public maxElapsedTime: number = 500

  /**
   * Threshold value that determines when `isRunningSlowly` returns `true`
   *
   * @remarks
   * Only affects loops with `useFixedTimeStep` set to `true`
   */
  public maxLaggingFrames: number = 4

  /**
   * The method being used to request an animation frame.
   * See {@link https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame | requestAnimationFrame}
   *
   * @remarks
   * This can be replaced by a custom implementation on the fly. For example when switching to
   * a VR headset rendering mode. Make sure to also replace the `cancelAnimationFrame` method
   * to an according implementation.
   */
  public requestAnimationFrame: (fn: FrameRequestCallback) => number = (fn: FrameRequestCallback) =>
    requestAnimationFrame(fn)

  /**
   * The method being used to cancel an animation frame.
   * See {@link https://developer.mozilla.org/en-US/docs/Web/API/window/cancelAnimationFrame | cancelAnimationFrame}
   *
   * @remarks
   * This can be replaced by a custom implementation on the fly. For example when switching to
   * a VR headset rendering mode. Make sure to also replace the `requestAnimationFrame` method
   * to an according implementation.
   */
  public cancelAnimationFrame: (id: number) => void = (id: number) => cancelAnimationFrame(id)

  /**
   * Function returning a high precision timestamp
   */
  public getTime: () => number = () => performance.now()

  /**
   * If set to true, skips the next execution of the draw routine.
   */
  public suppressDraw: boolean = false

  /**
   * Indicates whether the loop is active and is running
   */
  public get isRunning() {
    return this.frameId != null
  }

  /**
   * Indicates whether the loop is running slowly
   */
  public isRunningSlowly = false

  /**
   * The current timestamp in this frame
   */
  protected timeCurrent: number = 0

  /**
   * The elapsed time since last frame
   */
  protected timeElapsed: number = 0

  /**
   * The current frame number
   */
  protected frameCount: number = 0

  /**
   * The frame id as it was returned from `requestAnimationFrame`
   */
  protected frameId: number = null

  /**
   * Indicates how many frames the loop is lagging behind
   */
  protected frameLag: number = 0

  protected gameTime: LoopTimeParams = {
    frame: 0,
    deltaMs: 0,
    timeMs: 0,
    isRunningSlowly: false,
  }

  public onUpdate = eventSource<LoopTime>()
  public onDraw = eventSource<LoopTime>()

  private options: GameLoopOptions
  public constructor(options?: GameLoopOptions) {
    super()
    this.options = options || {}
    this.configure(this.options)
  }

  public initialize(world: GameWorld): void {
    this.configure(this.options)
  }

  public destroy(): void {
    this.stop()
    this.onDraw.clear()
    this.onUpdate.clear()
  }

  private configure(options: GameLoopOptions) {
    if (!options) {
      return
    }
    this.targetElapsedTime = options.targetElapsedTime ?? this.targetElapsedTime
    this.maxElapsedTime = options.maxElapsedTime ?? this.maxElapsedTime
    this.useFixedTimeStep = options.useFixedTimeStep ?? this.useFixedTimeStep
    this.getTime = options.getTime ?? this.getTime
    this.installAnimationFrame({
      requestAnimationFrame: options.requestAnimationFrame ?? this.requestAnimationFrame,
      cancelAnimationFrame: options.cancelAnimationFrame ?? this.cancelAnimationFrame,
    })
    if (options.autostart && !this.isRunning) {
      this.run()
    }
  }

  /**
   * Starts the loop if it is not already running.
   */
  public run() {
    if (!this.isRunning) {
      this.schedule()
    }
  }

  /**
   * Stops the loop. A pending animation request is immediately cancelled.
   *
   * @returns true if the loop was running and has been stopped
   */
  public stop() {
    const wasRunning = this.isRunning
    if (this.frameId != null) {
      this.cancelAnimationFrame(this.frameId)
    }
    this.frameId = null
    return wasRunning
  }

  public installAnimationFrame(options: {
    requestAnimationFrame?: (fn: FrameRequestCallback) => number
    cancelAnimationFrame?: (id: number) => void
  }) {
    const wasRunning = this.stop()
    this.requestAnimationFrame = options?.requestAnimationFrame ?? this.requestAnimationFrame
    this.cancelAnimationFrame = options?.cancelAnimationFrame ?? this.cancelAnimationFrame
    if (wasRunning) {
      this.schedule()
    }
  }

  public uninstallAnimationFrame() {
    this.installAnimationFrame({
      requestAnimationFrame,
      cancelAnimationFrame,
    })
  }

  private readonly tick = () => {
    const dt = this.getTime() - this.timeCurrent
    this.timeCurrent += dt
    this.timeElapsed += dt
    this.consumeTime()
    if (this.isRunning) {
      this.schedule()
    }
  }

  private schedule() {
    if (this.frameId != null) {
      this.cancelAnimationFrame(this.frameId)
    }
    this.frameId = this.requestAnimationFrame(this.tick)
  }

  protected consumeTime() {
    let elapsedTime = this.timeElapsed
    let consumedTime = 0

    if (this.useFixedTimeStep) {
      // target time not reached, skip update, no time consumed
      if (elapsedTime < this.targetElapsedTime) {
        return
      }

      // limit elapsed time to the maximum
      if (elapsedTime >= this.maxElapsedTime) {
        elapsedTime = this.maxElapsedTime
      }

      // schedule updates
      let scheduleCount = 0
      while (elapsedTime >= this.targetElapsedTime) {
        scheduleCount++
        elapsedTime -= this.targetElapsedTime
        consumedTime += this.targetElapsedTime
        this.scheduleUpdate(this.targetElapsedTime)
      }

      this.detectSlowLoop(scheduleCount)
    } else {
      consumedTime = elapsedTime
      elapsedTime = 0
      this.scheduleUpdate(consumedTime)
    }

    if (this.suppressDraw) {
      this.suppressDraw = false
    } else {
      this.scheduleDraw(consumedTime)
      this.frameCount++
    }

    this.timeElapsed = elapsedTime
  }

  protected scheduleUpdate(dt: number) {
    this.gameTime.timeMs = this.timeCurrent
    this.gameTime.deltaMs = dt
    this.gameTime.isRunningSlowly = this.isRunningSlowly
    this.gameTime.frame = this.frameCount
    this.onUpdate.emit(this.gameTime)
  }

  protected scheduleDraw(dt: number) {
    this.gameTime.timeMs = this.timeCurrent
    this.gameTime.deltaMs = dt
    this.gameTime.isRunningSlowly = this.isRunningSlowly
    this.gameTime.frame = this.frameCount
    this.onDraw.emit(this.gameTime)
  }

  protected detectSlowLoop(scheduleCount: number) {
    // if there were more than 1 scheduled updates, then we are lagging
    // accumulate the lagging frames
    if (scheduleCount > 1) {
      this.frameLag += scheduleCount - 1
    }

    // decrease the lag counter only if we did one single update
    if (scheduleCount === 1 && this.frameLag > 0) {
      this.frameLag--
    }

    // lag counter has decreased to 0 -> not running slow any more
    if (this.isRunningSlowly && this.frameLag === 0) {
      this.isRunningSlowly = false
    }

    // lag has increased to threshold -> running slow
    if (!this.isRunningSlowly && this.frameLag > this.maxLaggingFrames) {
      this.isRunningSlowly = true
    }
  }
}
