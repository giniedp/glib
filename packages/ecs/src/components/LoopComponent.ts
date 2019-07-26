import { cancelAnimationFrame, getOption, getTime, requestAnimationFrame } from '@gglib/utils'
import { Inject, Service } from '../decorators'
import { Entity } from './../Entity'

/**
 * Constructor options for the {@link LoopComponent}
 *
 * @public
 */
export interface LoopComponentOptions {
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
   * Indicates whether the components are updated recursively. See {@link Entity.initializeComponents}
   */
  recursiveInit?: boolean
  /**
   * Indicates whether the components are updated recursively. See {@link Entity.updateComponents}
   */
  recursiveUpdate?: boolean
  /**
   * Indicates whether the components are drawn recursively. See {@link Entity.drawComponents}
   */
  recursiveDraw?: boolean

  /**
   * A custom function as remplacement for {@link https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame}
   */
  requestAnimationFrame?: (fn: () => void) => number
  /**
   * A custom function as remplacement for {@link https://developer.mozilla.org/en-US/docs/Web/API/window/cancelAnimationFrame}
   */
  cancelAnimationFrame?: (id: number) => void
  /**
   * Function returning a high precision timestamp
   */
  getTime?: () => number
}

/**
 * @public
 */
@Service()
export class LoopComponent {

  /**
   * The name of this component (`'Loop'`)
   */
  public readonly name = 'Loop'

  /**
   * The entity that owns this component instance
   */
  @Inject(Entity)
  public readonly entity: Entity

  /**
   * Indicates whether fixed time step should be used. Default is `true`.
   */
  public useFixedTimeStep: boolean = true
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
   * Indicates whether the components are updated recursively {@link Entity.initializeComponents}
   */
  public recursiveInit: boolean = true
  /**
   * Indicates whether the components are updated recursively {@link Entity.updateComponents}
   */
  public recursiveUpdate: boolean = true
  /**
   * Indicates whether the components are drawn recursively {@link Entity.drawComponents}
   */
  public recursiveDraw: boolean = true

  /**
   * The method being used to request an animation frame.
   * See {@link https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame | requestAnimationFrame}
   *
   * @remarks
   * This can be replaced by a custom implementation on the fly. For example when switching to
   * a VR headset rendering mode. Make sure to also replace the `cancelAnimationFrame` method
   * to an according implementation.
   */
  public requestAnimationFrame: (fn: FrameRequestCallback) => number = requestAnimationFrame
  /**
   * The method being used to cancel an animation frame.
   * See {@link https://developer.mozilla.org/en-US/docs/Web/API/window/cancelAnimationFrame | cancelAnimationFrame}
   *
   * @remarks
   * This can be replaced by a custom implementation on the fly. For example when switching to
   * a VR headset rendering mode. Make sure to also replace the `requestAnimationFrame` method
   * to an according implementation.
   */
  public cancelAnimationFrame: (id: number) => void = cancelAnimationFrame
  /**
   * Function returning a high precision timestamp
   */
  public getTime: () => number = getTime

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
   * The frame id as it was returned from `requestAnimationFrame`
   */
  protected frameId: number = null

  /**
   * Indicates how many frames the loop is lagging behind
   */
  protected frameLag: number = 0

  constructor(params: LoopComponentOptions = {}) {
    this.targetElapsedTime = getOption(params, 'targetElapsedTime', this.targetElapsedTime)
    this.maxElapsedTime = getOption(params, 'maxElapsedTime', this.maxElapsedTime)
    this.useFixedTimeStep = getOption(params, 'useFixedTimeStep', this.useFixedTimeStep)
    this.recursiveInit = getOption(params, 'recursiveInit', this.recursiveInit)
    this.recursiveUpdate = getOption(params, 'recursiveUpdate', this.recursiveUpdate)
    this.recursiveDraw = getOption(params, 'recursiveDraw', this.recursiveDraw)
    this.getTime = getOption(params, 'getTime', this.getTime)
    this.requestAnimationFrame = getOption(params, 'requestAnimationFrame', this.requestAnimationFrame)
    this.cancelAnimationFrame = getOption(params, 'cancelAnimationFrame', this.cancelAnimationFrame)
  }

  /**
   * Starts the loop but does nothing if it is already running.
   */
  public run() {
    if (!this.isRunning) {
      this.frameId = 0
      this.tick()
    }
  }

  /**
   * Stops the loop. A pending animation request is immediately cancelled.
   */
  public stop() {
    this.cancelAnimationFrame(this.frameId)
    this.frameId = null
  }

  private readonly tick = () => {
    const dt = this.getTime() - this.timeCurrent
    this.timeCurrent += dt
    this.timeElapsed += dt
    this.consumeTime()
    if (this.isRunning) {
      this.frameId = this.requestAnimationFrame(this.tick)
    }
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
    }

    this.timeElapsed = elapsedTime
  }

  protected scheduleUpdate(dt: number) {
    this.entity.initializeComponents(this.recursiveInit)
    this.entity.updateComponents(dt, this.recursiveUpdate)
  }

  protected scheduleDraw(dt: number) {
    this.entity.drawComponents(dt, this.recursiveDraw)
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
