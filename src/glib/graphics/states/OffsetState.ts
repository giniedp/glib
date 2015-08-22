module Glib.Graphics {

  export interface OffsetStateOptions {
    offsetEnable?: boolean;
    offsetFactor?: number;
    offsetUnits?: number;
  }

  export class OffsetState implements OffsetStateOptions {
    device:Device;
    gl:any;
    _offsetEnable:boolean = false;
    _offsetFactor:number = 0;
    _offsetUnits:number = 0;
    _changed:boolean = false;
    _changes:OffsetStateOptions = {};

    constructor(device:Device, state?:OffsetStateOptions) {
      this.device = device;
      this.gl = device.context;
      this.resolve();
      this.extend(state);
    }

    get offsetEnable():boolean {
      return this._offsetEnable;
    }

    set offsetEnable(value:boolean) {
      if (this._offsetEnable !== value) {
        this._offsetEnable = value;
        this._changes.offsetEnable = value;
        this._changed = true;
      }
    }

    get offsetFactor():number {
      return this._offsetFactor;
    }

    set offsetFactor(value:number) {
      if (this._offsetFactor !== value) {
        this._offsetFactor = value;
        this._changes.offsetFactor = value;
        this._changed = true;
      }
    }

    get offsetUnits():number {
      return this._offsetUnits;
    }

    set offsetUnits(value:number) {
      if (this._offsetUnits !== value) {
        this._offsetUnits = value;
        this._changes.offsetUnits = value;
        this._changed = true;
      }
    }

    extend(state:OffsetStateOptions={}):OffsetState {
      utils.extend(this, state);
      return this
    }

    commit(state?:OffsetStateOptions):OffsetState {
      this.extend(state);

      if (!this._changed) {
        return this;
      }

      var changes = this._changes;

      if (changes.offsetFactor != null || changes.offsetUnits != null) {
        changes.offsetFactor = this.offsetFactor;
        changes.offsetUnits = this.offsetUnits;
      }

      OffsetState.commit(this.gl, this._changes);
      this._clearChanges();
      return this;
    }

    dump(out?:any):OffsetStateOptions {
      out = out || {};
      out.offsetEnable = this.offsetEnable;
      out.offsetFactor = this.offsetFactor;
      out.offsetUnits = this.offsetUnits;
      return out;
    }

    resolve():OffsetState {
      OffsetState.resolve(this.gl, this);
      this._clearChanges();
      return this;
    }

    private _clearChanges(){
      this._changed = false;
      this._changes.offsetEnable = undefined;
      this._changes.offsetFactor = undefined;
      this._changes.offsetUnits = undefined;
    }

    static convert(state:any):OffsetStateOptions {
      if (typeof state === 'string') {
        state = OffsetState[state];
      }
      if (!state) {
        return state;
      }
      return state;
    }

    static commit(gl:any, state:OffsetStateOptions) {
      var enable = state.offsetEnable;
      var factor = state.offsetFactor;
      var units = state.offsetUnits;

      if (enable !== undefined) {
        if (enable) {
          gl.enable(gl.POLYGON_OFFSET_FILL);
        } else {
          gl.disable(gl.POLYGON_OFFSET_FILL);
        }
      }
      if (factor !== undefined && units !== undefined) {
        gl.polygonOffset(factor, units);
      }
    }

    static resolve(gl:any, out?:any):OffsetStateOptions {
      out = out || {};

      out.offsetEnable = gl.getParameter(gl.POLYGON_OFFSET_FILL);
      out.offsetFactor = gl.getParameter(gl.POLYGON_OFFSET_FACTOR);
      out.offsetUnits = gl.getParameter(gl.POLYGON_OFFSET_UNITS);
      return out;
    }

    static Default = {
      offsetEnable: false,
      offsetFactor: 0,
      offsetUnits: 0
    }
  }
  Object.freeze(OffsetState.Default);
}
