module Glib.Graphics {

  export interface ViewportStateOptions {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    zMin?: number;
    zMax?: number;
  }

  export class ViewportState implements ViewportStateOptions {
    device:Device;
    gl:any;
    _x:number = 0;
    _y:number = 0;
    _width:number = 0;
    _height:number = 0;
    _zMin:number = 0;
    _zMax:number = 1;
    _changed:boolean = false;
    _changes:ViewportStateOptions = {};

    constructor(device:Device) {
      this.device = device;
      this.gl = device.context;
      this.resolve();
    }

    get x():number {
      return this._x;
    }

    set x(value:number) {
      if (this._x !== value) {
        this._x = value;
        this._changes.x = value;
        this._changed = true;
      }
    }

    get y():number {
      return this._y;
    }

    set y(value:number) {
      if (this._y !== value) {
        this._y = value;
        this._changes.y = value;
        this._changed = true;
      }
    }

    get width():number {
      return this._width;
    }

    set width(value:number) {
      if (this._width !== value) {
        this._width = value;
        this._changes.width = value;
        this._changed = true;
      }
    }

    get height():number {
      return this._height;
    }

    set height(value:number) {
      if (this._height !== value) {
        this._height = value;
        this._changes.height = value;
        this._changed = true;
      }
    }

    get zMin():number {
      return this._zMin;
    }

    set zMin(value:number) {
      if (this._zMin !== value) {
        this._zMin = value;
        this._changes.zMin = value;
        this._changed = true;
      }
    }

    get zMax():number {
      return this._zMax;
    }

    set zMax(value:number) {
      if (this._zMax !== value) {
        this._zMax = value;
        this._changes.zMax = value;
        this._changed = true;
      }
    }

    commit(state?:ViewportStateOptions):ViewportState {
      if (state) {
        utils.extend(this, state);
      }

      if (!this._changed) {
        return this;
      }

      var changes = this._changes;

      if (changes.x !== undefined || changes.y !== undefined ||
        changes.width !== undefined || changes.height !== undefined) {
        changes.x = this.x;
        changes.y = this.y;
        changes.width = this.width;
        changes.height = this.height;
      }

      if (changes.zMin !== undefined || changes.zMax !== undefined) {
        changes.zMin = this.zMin;
        changes.zMax = this.zMax;
      }

      ViewportState.commit(this.gl, changes);

      this._changed = false;
      this._changes = {};
      return this;
    }

    dump(out?:any):ViewportStateOptions {
      out = out || {};
      out.x = this.x;
      out.y = this.y;
      out.width = this.width;
      out.height = this.height;
      out.zMin = this.zMin;
      out.zMax = this.zMax;
      return out;
    }

    resolve():ViewportState {
      ViewportState.resolve(this.gl, this);
      return this;
    }

    static commit(gl:any, state:ViewportStateOptions) {
      var x = state.x;
      var y = state.y;
      var width = state.width;
      var height = state.height;
      var zMin = state.zMin;
      var zMax = state.zMax;

      if (x != null && y != null && width != null && height != null) {
        gl.viewport(x, y, width, height);
      }
      if (zMin != null && zMax != null) {
        gl.depthRange(zMin, zMax);
      }
    }

    static resolve(gl:any, out?:any):ViewportStateOptions {
      out = out || {};
      var range = gl.getParameter(gl.DEPTH_RANGE);
      out.zMin = range[0];
      out.zMax = range[1];
      var viewport = gl.getParameter(gl.VIEWPORT);
      out.x = viewport[0];
      out.y = viewport[1];
      out.width = viewport[2];
      out.height = viewport[3];
      return out;
    }
  }
}