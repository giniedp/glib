module Glib.Graphics {

  export interface DepthStateOptions {
    depthEnable? : boolean
    depthFunction? : number
    depthWriteEnable? : boolean
  }

  export class DepthState implements DepthStateOptions {
    device:Device;
    gl:any;
    _depthEnable:boolean = true;
    _depthFunction:number = CompareFunction.LessEqual;
    _depthWriteEnable:boolean = true;
    _changed:boolean;
    _changes:DepthStateOptions = {};

    constructor(device:Device) {
      this.device = device;
      this.gl = device.context;
      this.resolve();
    }

    get depthEnable():boolean {
      return this._depthEnable;
    }

    set depthEnable(value:boolean) {
      if (this._depthEnable !== value) {
        this._depthEnable = value;
        this._changes.depthEnable = value;
        this._changed = true;
      }
    }

    get depthWriteEnable():boolean {
      return this._depthWriteEnable;
    }

    set depthWriteEnable(value:boolean) {
      if (this._depthWriteEnable !== value) {
        this._depthWriteEnable = value;
        this._changes.depthWriteEnable = value;
        this._changed = true;
      }
    }

    get depthFunction():number {
      return this._depthFunction;
    }

    get depthFunctionName():string {
      return CompareFunctionName[this.depthFunction];
    }

    set depthFunction(value:number) {
      if (this._depthFunction !== value) {
        this._depthFunction = value;
        this._changes.depthFunction = value;
        this._changed = true;
      }
    }

    commit(state?:DepthStateOptions):DepthState {
      if (state) {
        utils.extend(this, state);
      }

      if (!this._changed) {
        return this;
      }

      DepthState.commit(this.gl, this._changes);

      this._changed = false;
      this._changes = {};
      delete this._changes.depthFunction;
      delete this._changes.depthWriteEnable;
      return this;
    }

    dump(out?:any):DepthStateOptions {
      out = out || {};
      out.depthEnable = this.depthEnable;
      out.depthFunction = this.depthFunction;
      out.depthWriteEnable = this.depthWriteEnable;
      return out;
    }

    resolve():DepthState {
      DepthState.resolve(this.gl, this);
      return this;
    }

    static convert(state:any):DepthStateOptions {
      if (typeof state === 'string') {
        state = DepthState[state];
      }
      if (!state) {
        return state;
      }
      if (state.depthFunction) {
        state.depthFunction = CompareFunction[state.depthFunction];
      }
      return state;
    }

    static commit(gl:any, state:DepthStateOptions) {
      var depthFunction = state.depthFunction;
      var depthEnable = state.depthEnable;
      var depthWriteEnable = state.depthWriteEnable;

      if (depthFunction !== undefined) {
        gl.depthFunc(depthFunction);
      }
      if (depthWriteEnable !== undefined) {
        gl.depthMask(depthWriteEnable);
      }

      if (depthEnable !== undefined) {
        if (depthEnable) {
          gl.enable(gl.DEPTH_TEST);
        } else {
          gl.disable(gl.DEPTH_TEST);
        }
      }
    }

    static resolve(gl:any, out?:any):DepthStateOptions {
      out = out || {};

      out.depthEnable = gl.getParameter(gl.DEPTH_TEST);
      out.depthFunction = gl.getParameter(gl.DEPTH_FUNC);
      out.depthWriteEnable = gl.getParameter(gl.DEPTH_WRITEMASK);

      return out;
    }

    static Default = {
      depthEnable: true,
      depthFunction: CompareFunction.LessEqual,
      depthWriteEnable: true
    };

    static None = {
      depthEnable: false,
      depthFunction: CompareFunction.LessEqual,
      depthWriteEnable: true
    };

    static DepthRead = {
      depthEnable: true,
      depthFunction: CompareFunction.LessEqual,
      depthWriteEnable: false
    };
  }
  Object.freeze(DepthState.Default);
  Object.freeze(DepthState.None);
  Object.freeze(DepthState.DepthRead);
}