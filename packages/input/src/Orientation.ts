import { IVec3 } from '@gglib/math'
import { eventSource } from '@gglib/utils'

/**
 * Orientation constructor options
 *
 * @public
 */
export interface IOrientationOptions {
  eventTarget?: EventTarget
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
export class Orientation {
  public static readonly hasOrientationApi = 'DeviceOrientationEvent' in window
  public static readonly hasMotionApi = 'DeviceMotionEvent' in window

  public state: IOrientationState = {
    orientation: {
      absolute: false,
      alpha: 0,
      beta: 0,
      gamma: 0,
    },
    acceleration: {
      x: 0,
      y: 0,
      z: 0,
    },
    accelerationIncludingGravity: {
      x: 0,
      y: 0,
      z: 0,
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

  public onChanged = eventSource<Orientation>()

  /**
   *
   */
  constructor() {
    if (!Orientation.hasOrientationApi) {
      console.warn('[Orientation] orientation api is not supported')
    }
    if (!Orientation.hasMotionApi) {
      console.warn('[Orientation] motion api is not supported')
    }
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
    out.orientation = Object.assign(out.orientation || {}, state.orientation)
    out.acceleration = Object.assign(out.acceleration || {}, state.acceleration)
    out.accelerationIncludingGravity = Object.assign(
      out.accelerationIncludingGravity || {},
      state.accelerationIncludingGravity,
    )
    out.rotation = Object.assign(out.rotation || {}, state.rotation)
    return out
  }

  protected handleOrientationEvent(e: DeviceOrientationEvent) {
    let orientation = this.state.orientation || ({} as IDeviceOrientation) // tslint:disable-line
    orientation.absolute = e.absolute
    orientation.alpha = e.alpha
    orientation.beta = e.beta
    orientation.gamma = e.gamma
    this.state.orientation = orientation
    this.onChanged.emit(this)
  }

  protected handleMotionEvent(e: DeviceMotionEvent) {
    let acceleration = this.state.acceleration || ({} as IVec3) // tslint:disable-line
    acceleration.x = e.acceleration.x
    acceleration.y = e.acceleration.y
    acceleration.z = e.acceleration.z
    this.state.acceleration = acceleration

    acceleration = this.state.accelerationIncludingGravity || ({} as IVec3) // tslint:disable-line
    acceleration.x = e.accelerationIncludingGravity.x
    acceleration.y = e.accelerationIncludingGravity.y
    acceleration.z = e.accelerationIncludingGravity.z
    this.state.accelerationIncludingGravity = acceleration

    let rotation = this.state.rotation || ({} as IDeviceRotation) // tslint:disable-line
    rotation.alpha = e.rotationRate.alpha
    rotation.beta = e.rotationRate.beta
    rotation.gamma = e.rotationRate.gamma
    this.state.rotation = rotation
    this.state.interval = e.interval

    this.onChanged.emit(this)
  }
}
