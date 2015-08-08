module Glib.Graphics {

  export interface StencilStateOptions {
    enable?: boolean;
    stencilFunction?: number;
    stencilReference?: number;
    stencilMask?: number;
    stencilFail?: number;
    stencilDepthFail?: number;
    stencilDepthPass?: number;
    stencilBackFunction?: number;
    stencilBackReference?: number;
    stencilBackMask?: number;
    stencilBackFail?: number;
    stencilBackDepthFail?: number;
    stencilBackDepthPass?: number;
  }

  export class StencilState implements StencilStateOptions {
    device:Device;
    gl:any;
    _enable:boolean = false;
    _stencilFunction:number = CompareFunction.Always;
    _stencilReference:number = 0;
    _stencilMask:number = 0xffffffff;
    _stencilFail:number = StencilOperation.Keep;
    _stencilDepthFail:number = StencilOperation.Keep;
    _stencilDepthPass:number = StencilOperation.Keep;
    _stencilBackFunction:number = CompareFunction.Always;
    _stencilBackReference:number = 0;
    _stencilBackMask:number = 0xffffffff;
    _stencilBackFail:number = StencilOperation.Keep;
    _stencilBackDepthFail:number = StencilOperation.Keep;
    _stencilBackDepthPass:number = StencilOperation.Keep;
    _changes:StencilStateOptions = {};
    _changed:boolean = false;

    constructor(device:Device) {
      this.device = device;
      this.gl = device.context;
      this.resolve();
    }

    get stencilFunction():number {
      return this._stencilFunction;
    }

    get stencilFunctionName():string {
      return CompareFunctionName[this._stencilFunction];
    }

    set stencilFunction(value:number) {
      if (this._stencilFunction !== value) {
        this._stencilFunction = value;
        this._changes.stencilFunction = value;
        this._changed = true;
      }
    }

    get stencilBackFunction():number {
      return this._stencilBackFunction;
    }

    get stencilBackFunctionName():string {
      return CompareFunctionName[this._stencilBackFunction];
    }

    set stencilBackFunction(value:number) {
      if (this._stencilBackFunction !== value) {
        this._stencilBackFunction = value;
        this._changes.stencilBackFunction = value;
        this._changed = true;
      }
    }

    get stencilFail():number {
      return this._stencilFail;
    }

    get stencilFailName():string {
      return CompareFunctionName[this._stencilFail];
    }

    set stencilFail(value:number) {
      if (this._stencilFail !== value) {
        this._stencilFail = value;
        this._changes.stencilFail = value;
        this._changed = true;
      }
    }

    get stencilDepthFail():number {
      return this._stencilDepthFail;
    }

    get stencilDepthFailName():string {
      return CompareFunctionName[this._stencilDepthFail];
    }

    set stencilDepthFail(value:number) {
      if (this._stencilDepthFail !== value) {
        this._stencilDepthFail = value;
        this._changes.stencilDepthFail = value;
        this._changed = true;
      }
    }

    get stencilDepthPass():number {
      return this._stencilDepthPass;
    }

    get stencilDepthPassName():string {
      return CompareFunctionName[this._stencilDepthPass];
    }

    set stencilDepthPass(value:number) {
      if (this._stencilDepthPass !== value) {
        this._stencilDepthPass = value;
        this._changes.stencilDepthPass = value;
        this._changed = true;
      }
    }

    get stencilBackFail():number {
      return this._stencilBackFail;
    }

    get stencilBackFailName():string {
      return CompareFunctionName[this._stencilBackFail];
    }

    set stencilBackFail(value:number) {
      if (this._stencilBackFail !== value) {
        this._stencilBackFail = value;
        this._changes.stencilBackFail = value;
        this._changed = true;
      }
    }

    get stencilBackDepthFail():number {
      return this._stencilBackDepthFail;
    }

    get stencilBackDepthFailName():string {
      return CompareFunctionName[this._stencilBackDepthFail];
    }

    set stencilBackDepthFail(value:number) {
      if (this._stencilBackDepthFail !== value) {
        this._stencilBackDepthFail = value;
        this._changes.stencilBackDepthFail = value;
        this._changed = true;
      }
    }

    get stencilBackDepthPass():number {
      return this._stencilBackDepthPass;
    }

    get stencilBackDepthPassName():string {
      return CompareFunctionName[this._stencilBackDepthPass];
    }

    set stencilBackDepthPass(value:number) {
      if (this._stencilBackDepthPass !== value) {
        this._stencilBackDepthPass = value;
        this._changes.stencilBackDepthPass = value;
        this._changed = true;
      }
    }

    get stencilReference():number {
      return this._stencilReference;
    }

    set stencilReference(value:number) {
      if (this._stencilReference !== value) {
        this._stencilReference = value;
        this._changes.stencilReference = value;
        this._changed = true;
      }
    }

    get stencilMask():number {
      return this._stencilMask;
    }

    set stencilMask(value:number) {
      if (this._stencilMask !== value) {
        this._stencilMask = value;
        this._changes.stencilMask = value;
        this._changed = true;
      }
    }

    get stencilBackReference():number {
      return this._stencilBackReference;
    }

    set stencilBackReference(value:number) {
      if (this._stencilBackReference !== value) {
        this._stencilBackReference = value;
        this._changes.stencilBackReference = value;
        this._changed = true;
      }
    }

    get stencilBackMask():number {
      return this._stencilBackMask;
    }

    set stencilBackMask(value:number) {
      if (this._stencilBackMask !== value) {
        this._stencilBackMask = value;
        this._changes.stencilBackMask = value;
        this._changed = true;
      }
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

    commit(state?:StencilStateOptions):StencilState {
      if (state) {
        utils.extend(this, state);
      }

      if (!this._changed) {
        return this;
      }

      var changes = this._changes;

      if (changes.stencilFunction !== undefined ||
        changes.stencilReference !== undefined ||
        changes.stencilMask !== undefined) {
        changes.stencilFunction = this.stencilFunction;
        changes.stencilReference = this.stencilReference;
        changes.stencilMask = this.stencilMask;
      }

      if (changes.stencilFail !== undefined ||
        changes.stencilDepthFail !== undefined ||
        changes.stencilDepthPass !== undefined) {
        changes.stencilFail = this.stencilFail;
        changes.stencilDepthFail = this.stencilDepthFail;
        changes.stencilDepthPass = this.stencilDepthPass;
      }

      if (changes.stencilBackFunction !== undefined ||
        changes.stencilBackReference !== undefined ||
        changes.stencilBackMask !== undefined) {
        changes.stencilBackFunction = this.stencilBackFunction;
        changes.stencilBackReference = this.stencilBackReference;
        changes.stencilBackMask = this.stencilBackMask;
      }

      if (changes.stencilBackFail !== undefined ||
        changes.stencilBackDepthFail !== undefined ||
        changes.stencilBackDepthPass !== undefined) {
        changes.stencilBackFail = this.stencilBackFail;
        changes.stencilBackDepthFail = this.stencilBackDepthFail;
        changes.stencilBackDepthPass = this.stencilBackDepthPass;
      }

      StencilState.commit(this.gl, changes);

      this._changed = false;
      this._changes = {};
      return this;
    }

    resolve():StencilState {
      StencilState.resolve(this.gl, this);
      return this;
    }

    dump(out?:any):StencilStateOptions {
      out = out || {};
      out.enable = this.enable;
      out.stencilFunction = this.stencilFunction;
      out.stencilReference = this.stencilReference;
      out.stencilMask = this.stencilMask;
      out.stencilFail = this.stencilFail;
      out.stencilDepthFail = this.stencilDepthFail;
      out.stencilDepthPass = this.stencilDepthPass;
      out.stencilBackFunction = this.stencilBackFunction;
      out.stencilBackReference = this.stencilBackReference;
      out.stencilBackMask = this.stencilBackMask;
      out.stencilBackFail = this.stencilBackFail;
      out.stencilBackDepthFail = this.stencilBackDepthFail;
      out.stencilBackDepthPass = this.stencilBackDepthPass;
      return out;
    }

    static convert(state:any):StencilStateOptions {
      if (typeof state === 'string') {
        state = StencilState[state];
      }
      if (!state) {
        return state;
      }
      if (state.stencilFunction) {
        state.stencilFunction = CompareFunction[state.stencilFunction];
      }
      if (state.stencilBackFunction) {
        state.stencilBackFunction = CompareFunction[state.stencilBackFunction];
      }

      if (state.stencilFail) {
        state.stencilFail = StencilOperation[state.stencilFail];
      }
      if (state.stencilDepthFail) {
        state.stencilDepthFail = StencilOperation[state.stencilDepthFail];
      }
      if (state.stencilDepthPass) {
        state.stencilDepthPass = StencilOperation[state.stencilDepthPass];
      }

      if (state.stencilBackFail) {
        state.stencilBackFail = StencilOperation[state.stencilBackFail];
      }
      if (state.stencilBackDepthFail) {
        state.stencilBackDepthFail = StencilOperation[state.stencilBackDepthFail];
      }
      if (state.stencilBackDepthPass) {
        state.stencilBackDepthPass = StencilOperation[state.stencilBackDepthPass];
      }
      return state;
    }

    static commit(gl:any, state:StencilStateOptions) {
      var enable = state.enable;
      if (enable !== undefined) {
        if (enable) {
          gl.enable(gl.STENCIL_TEST);
        } else {
          gl.disable(gl.STENCIL_TEST);
        }
      }

      var stencilFunction = state.stencilFunction;
      var stencilReference = state.stencilReference;
      var stencilMask = state.stencilMask;
      if (stencilFunction !== undefined &&
        stencilReference !== undefined &&
        stencilMask !== undefined) {
        gl.stencilFuncSeparate(CullMode.Front, stencilFunction, stencilReference, stencilMask);
      }

      var stencilFail = state.stencilFail;
      var stencilDepthFail = state.stencilDepthFail;
      var stencilDepthPass = state.stencilDepthPass;
      if (stencilFail !== undefined &&
        stencilDepthFail !== undefined &&
        stencilDepthPass !== undefined) {
        gl.stencilOpSeparate(CullMode.Front, stencilFail, stencilDepthFail, stencilDepthPass);
      }

      var stencilBackFunction = state.stencilBackFunction;
      var stencilBackReference = state.stencilBackReference;
      var stencilBackMask = state.stencilBackMask;
      if (stencilBackFunction !== undefined &&
        stencilBackReference !== undefined &&
        stencilBackMask !== undefined) {
        gl.stencilFuncSeparate(CullMode.Back, stencilBackFunction, stencilBackReference, stencilBackMask);
      }

      var stencilBackFail = state.stencilBackFail;
      var stencilBackDepthFail = state.stencilBackDepthFail;
      var stencilBackDepthPass = state.stencilBackDepthPass;
      if (stencilBackFail !== undefined &&
        stencilBackDepthFail !== undefined &&
        stencilBackDepthPass !== undefined) {
        gl.stencilOpSeparate(CullMode.Back, stencilBackFail, stencilBackDepthFail, stencilBackDepthPass);
      }
    }

    static resolve(gl, out?:any):StencilStateOptions {
      out = out || {};

      out.enable = gl.getParameter(gl.STENCIL_TEST);

      out.stencilFunction = gl.getParameter(gl.STENCIL_FUNC);
      out.stencilReference = gl.getParameter(gl.STENCIL_REF);
      out.stencilMask = gl.getParameter(gl.STENCIL_VALUE_MASK);

      out.stencilFail = gl.getParameter(gl.STENCIL_FAIL);
      out.stencilDepthFail = gl.getParameter(gl.STENCIL_PASS_DEPTH_FAIL);
      out.stencilDepthPass = gl.getParameter(gl.STENCIL_PASS_DEPTH_PASS);

      out.stencilBackFunction = gl.getParameter(gl.STENCIL_BACK_FUNC);
      out.stencilBackReference = gl.getParameter(gl.STENCIL_BACK_REF);
      out.stencilBackReference = gl.getParameter(gl.STENCIL_BACK_VALUE_MASK);

      out.stencilBackFail = gl.getParameter(gl.STENCIL_BACK_FAIL);
      out.stencilBackDepthFail = gl.getParameter(gl.STENCIL_BACK_PASS_DEPTH_FAIL);
      out.stencilBackDepthPass = gl.getParameter(gl.STENCIL_BACK_PASS_DEPTH_PASS);
      return out;
    }

    static Default = {
      enable: false,

      // front face stencil
      stencilFunction: CompareFunction.Always,
      stencilReference: 0,
      stencilMask: 0xffffffff,

      stencilFail: StencilOperation.Keep,
      stencilDepthFail: StencilOperation.Keep,
      stencilDepthPass: StencilOperation.Keep,

      // back face stencil
      stencilBackFunction: CompareFunction.Always,
      stencilBackReference: 0,
      stencilBackMask: 0xffffffff,

      stencilBackFail: StencilOperation.Keep,
      stencilBackDepthFail: StencilOperation.Keep,
      stencilBackDepthPass: StencilOperation.Keep
    }
  }
  Object.freeze(StencilState.Default);
}
