module Glib.Input {

  let hasOrientationApi = 'DeviceOrientationEvent' in window
  let hasMotionApi = 'DeviceMotionEvent' in window

  /**
   * Orientation constructor options
   */
  export interface IOrientationOptions {
    element?: EventTarget,
    events?: string[]
  }

  export interface IDeviceOrientation {
    absolute: boolean 
    alpha: number 
    beta: number 
    gamma: number
  }
  export interface IDeviceRotation {
    alpha: number
    beta: number
    gamma: number    
  }
  /**
   * Captured orientation state
   */
  export interface IOrientationState {
    orientation: IDeviceOrientation
    acceleration: IVec3
    accelerationIncludingGravity: IVec3
    rotation: IDeviceRotation
    interval?: number
  }

  export class Orientation extends Glib.Events {
    state:IOrientationState = {
      orientation: {
        absolute: false, alpha: 0, beta: 0, gamma: 0
      },
      acceleration: {
        x: 0, y: 0, z: 0
      },
      accelerationIncludingGravity: {
        x: 0, y: 0, z: 0
      },
      rotation: {
        alpha: 0,
        beta: 0,
        gamma: 0
      },
      interval: 0
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
    protected onEvent:EventListener = (e:Event) => this.trigger(e.type, this, e)

    /**
     * 
     */
    constructor() {
      super()
      if (!hasOrientationApi) utils.warn('[Device] orientation api is not supported by the device')
      if (!hasMotionApi) utils.warn('[Device] motion api is not supported by the device')
      this.activate()
    }

    activate() {
      this.deactivate()
      window.addEventListener('deviceorientation', this.onDeviceOrientation)
      window.addEventListener('devicemotion', this.onDeviceMotion)
    }

    deactivate() {
      window.removeEventListener('deviceorientation', this.onDeviceOrientation)
      window.removeEventListener('devicemotion', this.onDeviceMotion)
    }

    copyState(out:any = {}):any{
      var state = this.state
      out.orientation = utils.extend(out.orientation || {}, state.orientation)
      out.acceleration = utils.extend(out.acceleration || {}, state.acceleration)
      out.accelerationIncludingGravity = utils.extend(out.accelerationIncludingGravity || {}, state.accelerationIncludingGravity)
      out.rotation = utils.extend(out.rotation || {}, state.rotation)
      return out;
    }

    protected handleOrientationEvent(e:DeviceOrientationEvent) {
      var orientation = this.state.orientation || {} as IDeviceOrientation
      orientation.absolute = e.absolute
      orientation.alpha    = e.alpha
      orientation.beta     = e.beta
      orientation.gamma    = e.gamma
      this.state.orientation = orientation
      this.trigger('changed', this, e);
    }

    protected handleMotionEvent(e:DeviceMotionEvent) {
      
      var acceleration = this.state.acceleration || {} as IVec3
      acceleration.x = e.acceleration.x
      acceleration.y = e.acceleration.y
      acceleration.z = e.acceleration.z
      this.state.acceleration = acceleration

      acceleration = this.state.accelerationIncludingGravity || {} as IVec3
      acceleration.x = e.accelerationIncludingGravity.x
      acceleration.y = e.accelerationIncludingGravity.y
      acceleration.z = e.accelerationIncludingGravity.z
      this.state.accelerationIncludingGravity = acceleration

      let rotation = this.state.rotation || {} as IDeviceRotation
      rotation.alpha = e.rotationRate.alpha
      rotation.beta = e.rotationRate.beta
      rotation.gamma = e.rotationRate.gamma
      this.state.rotation = rotation
      this.state.interval = e.interval
      
      this.trigger('changed', this, e)
    }
  }
}
