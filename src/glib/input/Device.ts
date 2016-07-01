module Glib.Input {

  import extend = Glib.utils.extend;

  function updateOrientation(e:DeviceOrientationEvent, state:any) {
    var orientation = state.orientation || {};
    orientation.absolute = e.absolute;
    orientation.alpha    = e.alpha;
    orientation.beta     = e.beta;
    orientation.gamma    = e.gamma;
    state.orientation = orientation;
  }

  function updateMotion(e:DeviceMotionEvent, state:any) {
    var acceleration = state.acceleration || {};
    acceleration.x = e.acceleration.x;
    acceleration.y = e.acceleration.y;
    acceleration.z = e.acceleration.z;
    state.acceleration = acceleration;

    acceleration = state.accelerationIncludingGravity || {};
    acceleration.x = e.accelerationIncludingGravity.x;
    acceleration.y = e.accelerationIncludingGravity.y;
    acceleration.z = e.accelerationIncludingGravity.z;
    state.accelerationIncludingGravity = acceleration;

    state.rotationRate = e.rotationRate;
    state.interval = e.interval;
  }

  export class Device {
    el:any = self;
    state:any = {};
    _onDeviceOrientation:(e) => void;
    _onDeviceMotion:(e) => void;

    constructor(options:any={}) {
      extend(this, options);
      this._onDeviceOrientation = (e) => updateOrientation(e, this.state);
      this._onDeviceMotion = (e) => updateMotion(e, this.state);
      this.activate();
    }

    activate() {
      this.el.addEventListener('deviceorientation', this._onDeviceOrientation);
      this.el.addEventListener('MozOrientation', this._onDeviceOrientation);
      this.el.addEventListener('devicemotion', this._onDeviceMotion);
    }

    deactivate() {
      this.el.removeEventListener('deviceorientation', this._onDeviceOrientation);
      this.el.removeEventListener('MozOrientation', this._onDeviceOrientation);
      this.el.removeEventListener('devicemotion', this._onDeviceMotion);
    }

    getState(out:any = {}):any{
      var state = this.state;
      var orientation = out.orientation || {};
      orientation.absolute = state.orientation.absolute;
      orientation.alpha    = state.orientation.alpha;
      orientation.beta     = state.orientation.beta;
      orientation.gamma    = state.orientation.gamma;
      out.orientation = orientation;

      var acceleration = out.acceleration || {};
      acceleration.x = state.acceleration.x;
      acceleration.y = state.acceleration.y;
      acceleration.z = state.acceleration.z;
      out.acceleration = acceleration;

      acceleration = out.accelerationIncludingGravity || {};
      acceleration.x = state.accelerationIncludingGravity.x;
      acceleration.y = state.accelerationIncludingGravity.y;
      acceleration.z = state.accelerationIncludingGravity.z;
      out.accelerationIncludingGravity = acceleration;

      out.rotationRate = state.rotationRate;
      out.interval = state.interval;
      return out;
    }
  }
}
