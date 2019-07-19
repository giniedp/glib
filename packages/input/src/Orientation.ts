import { IVec3 } from '@gglib/math'
import { Events, extend, Log } from '@gglib/utils'

/**
 * Orientation constructor options
 *
 * @public
 */
export interface IOrientationOptions {
  eventTarget?: EventTarget,
  events?: string[]
}

/**
 * @public
 */
export interface IDeviceOrientation {
  absolute: boolean
  alpha: number
  beta: number
  gamma: number
}

/**
 * @public
 */
export interface IDeviceRotation {
  alpha: number
  beta: number
  gamma: number
}

/**
 * Captured orientation state
 *
 * @public
 */
export interface IOrientationState {
  orientation: IDeviceOrientation
  acceleration: IVec3
  accelerationIncludingGravity: IVec3
  rotation: IDeviceRotation
  interval?: number
}

/**
 * @public
 */
export class Orientation extends Events {

  public static readonly hasOrientationApi = 'DeviceOrientationEvent' in window
  public static readonly hasMotionApi = 'DeviceMotionEvent' in window

  public state: IOrientationState = {
    orientation: {
      absolute: false, alpha: 0, beta: 0, gamma: 0,
    },
    acceleration: {
      x: 0, y: 0, z: 0,
    },
    accelerationIncludingGravity: {
      x: 0, y: 0, z: 0,
    },
    rotation: {
      alpha: 0,
      beta: 0,
      gamma: 0,
    },
    interval: 0,
  }

  /**
   *
   */
  protected onDeviceOrientation = this.handleOrientationEvent.bind(this)
  /**
   *
   */
  protected onDeviceMotion = this.handleMotionEvent.bind(this)
  /**
   * Triggers the Event that occurred on the element
   */
  protected onEvent: EventListener = (e: Event) => this.trigger(e.type, this, e)

  /**
   *
   */
  constructor() {
    super()
    if (!Orientation.hasOrientationApi) { Log.w('[Orientation] orientation api is not supported') }
    if (!Orientation.hasMotionApi) { Log.w('[Orientation] motion api is not supported') }
    this.activate()
  }

  public activate() {
    this.deactivate()
    window.addEventListener('deviceorientation', this.onDeviceOrientation)
    window.addEventListener('devicemotion', this.onDeviceMotion)
  }

  public deactivate() {
    window.removeEventListener('deviceorientation', this.onDeviceOrientation)
    window.removeEventListener('devicemotion', this.onDeviceMotion)
  }

  public copyState(out: any = {}): any {
    let state = this.state
    out.orientation = extend(out.orientation || {}, state.orientation)
    out.acceleration = extend(out.acceleration || {}, state.acceleration)
    out.accelerationIncludingGravity = extend(out.accelerationIncludingGravity || {}, state.accelerationIncludingGravity)
    out.rotation = extend(out.rotation || {}, state.rotation)
    return out
  }

  protected handleOrientationEvent(e: DeviceOrientationEvent) {
    let orientation = this.state.orientation || {} as IDeviceOrientation // tslint:disable-line
    orientation.absolute = e.absolute
    orientation.alpha    = e.alpha
    orientation.beta     = e.beta
    orientation.gamma    = e.gamma
    this.state.orientation = orientation
    this.trigger('changed', this, e)
  }

  protected handleMotionEvent(e: DeviceMotionEvent) {

    let acceleration = this.state.acceleration || {} as IVec3 // tslint:disable-line
    acceleration.x = e.acceleration.x
    acceleration.y = e.acceleration.y
    acceleration.z = e.acceleration.z
    this.state.acceleration = acceleration

    acceleration = this.state.accelerationIncludingGravity || {} as IVec3 // tslint:disable-line
    acceleration.x = e.accelerationIncludingGravity.x
    acceleration.y = e.accelerationIncludingGravity.y
    acceleration.z = e.accelerationIncludingGravity.z
    this.state.accelerationIncludingGravity = acceleration

    let rotation = this.state.rotation || {} as IDeviceRotation // tslint:disable-line
    rotation.alpha = e.rotationRate.alpha
    rotation.beta = e.rotationRate.beta
    rotation.gamma = e.rotationRate.gamma
    this.state.rotation = rotation
    this.state.interval = e.interval

    this.trigger('changed', this, e)
  }
}
