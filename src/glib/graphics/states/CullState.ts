module Glib.Graphics {

  export interface CullStateOptions {
    frontFace?: number
    cullMode?: number
    culling?: boolean
  }

  export class CullState implements CullStateOptions {
    device:Device;
    gl:any;
    _frontFace:number = FrontFace.CounterClockWise;
    _cullMode:number = CullMode.Back;
    _culling:boolean = false;
    _changed:boolean = false;
    _changes:CullStateOptions = {};

    constructor(device:Device, state?:CullStateOptions) {
      this.device = device;
      this.gl = device.context;
      this.resolve();
      this.extend(state);
    }
    
    get culling():boolean {
      return this._culling;
    }

    set culling(value:boolean) {
      if (this._culling !== value) {
        this._culling = value;
        this._changes.culling = value;
        this._changed = true;
      }
    }

    get frontFace():number {
      return this._frontFace;
    }

    get frontFaceName():string {
      return FrontFaceName[this.frontFace];
    }

    set frontFace(value:number) {
      if (this._frontFace !== value) {
        this._frontFace = value;
        this._changes.frontFace = value;
        this._changed = true;
      }
    }


    get cullMode():number {
      return this._cullMode;
    }

    get cullModeName():string {
      return CullModeName[this.cullMode];
    }

    set cullMode(value:number) {
      if (this._cullMode !== value) {
        this._cullMode = value;
        this._changes.cullMode = value;
        this._changed = true;
      }
    }

    extend(state:CullStateOptions={}):CullState {
      utils.extend(this, state);
      return this
    }

    commit(state?:CullStateOptions):CullState {
      this.extend(state);

      if (!this._changed) {
        return this;
      }

      CullState.commit(this.gl, this._changes);
      this._clearChanges();
      return this;
    }

    resolve():CullState {
      CullState.resolve(this.gl, this);
      this._clearChanges();
      return this;
    }

    dump(out?:any):CullStateOptions {
      out = out || {};
      out.culling = this.culling;
      out.cullMode = this.cullMode;
      out.frontFace = this.frontFace;
      return out;
    }

    private _clearChanges() {
      this._changes.culling = undefined;
      this._changes.cullMode = undefined;
      this._changes.frontFace = undefined;
      this._changed = false;
    }

    static convert(state:any):CullStateOptions {
      if (typeof state === 'string') {
        state = CullState[state];
      }
      if (!state) {
        return state;
      }
      if (state.cullMode) {
        state.cullMode = CullMode[state.cullMode];
      }
      if (state.frontFace) {
        state.frontFace = FrontFace[state.frontFace];
      }
      return state;
    }

    static commit(gl:any, state:CullStateOptions) {
      var culling = state.culling;
      var cullMode = state.cullMode;
      var frontFace = state.frontFace;

      if (culling === true) {
        gl.enable(gl.CULL_FACE);
      } else if (culling === false) {
        gl.disable(gl.CULL_FACE);
      }
      if (cullMode !== undefined) {
        gl.cullFace(cullMode);
      }
      if (frontFace !== undefined) {
        gl.frontFace(frontFace);
      }
    }

    static resolve(gl:any, out?:any):CullStateOptions {
      out = out || {};
      out.frontFace = gl.getParameter(gl.FRONT_FACE);
      out.culling = gl.getParameter(gl.CULL_FACE);
      out.cullMode = gl.getParameter(gl.CULL_FACE_MODE);
      return out;
    }

    static Default = {
      culling: false,
      cullMode: CullMode.Back,
      frontFace: FrontFace.CounterClockWise
    };

    static CullNone = {
      culling: false,
      cullMode: CullMode.Back,
      frontFace: FrontFace.CounterClockWise
    };

    static CullClockWise = {
      culling: true,
      cullMode: CullMode.Back,
      frontFace: FrontFace.CounterClockWise
    };

    static CullCounterClockWise = {
      culling: true,
      cullMode: CullMode.Back,
      frontFace: FrontFace.ClockWise
    };
  }
  Object.freeze(CullState.Default);
  Object.freeze(CullState.CullNone);
  Object.freeze(CullState.CullClockWise);
  Object.freeze(CullState.CullCounterClockWise);
}
