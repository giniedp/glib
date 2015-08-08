module Glib.Graphics {

  export interface ScissorStateOptions {
    enable?: boolean;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  }

  export class ScissorState implements ScissorStateOptions {
    device:Device;
    gl:any;
    _enable:boolean = false;
    _x:number = 0;
    _y:number = 0;
    _width:number = 0;
    _height:number = 0;
    _changed:boolean = false;
    _changes:ScissorStateOptions = {};

    constructor(device:Device) {
      this.device = device;
      this.gl = device.context;
      this.resolve();
    }

    get enable():boolean {
      return this._enable;
    }

    set enable(value:boolean) {
      if (this._enable !== value) {
        this._enable = value;
        this._changes.enable = value;
        this._changed = true;
      }
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

    commit(state?:ScissorStateOptions):ScissorState {
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

      ScissorState.commit(this.gl, this._changes);

      this._changed = false;
      this._changes = {};
      return this;
    }

    resolve():ScissorState {
      ScissorState.resolve(this.gl, this);
      return this;
    }

    dump(out?:any):ScissorStateOptions {
      out = out || {};
      out.enable = this.enable;
      out.x = this.x;
      out.y = this.y;
      out.width = this.width;
      out.height = this.height;
      return out;
    }

    static commit(gl:any, state:ScissorStateOptions) {
      var x = state.x;
      var y = state.y;
      var width = state.width;
      var height = state.height;
      var enable = state.enable;

      if (enable !== undefined) {
        if (enable) {
          gl.enable(gl.SCISSOR_TEST);
        } else {
          gl.disable(gl.SCISSOR_TEST);
        }
      }
      if (x != null && y != null && width != null && height != null) {
        gl.scissor(x, y, width, height);
      }
    }

    static resolve(gl:any, out?:any):ScissorStateOptions {
      out = out || {};
      out.enable = gl.getParameter(gl.SCISSOR_TEST);
      var scissor = gl.getParameter(gl.SCISSOR_BOX);
      out.x = scissor[0];
      out.y = scissor[1];
      out.width = scissor[2];
      out.height = scissor[3];
      return out;
    }

    static Default = {
      enable: false,
      x: 0,
      y: 0,
      width: 0,
      height: 0
    }
  }
  Object.freeze(ScissorState.Default);
}