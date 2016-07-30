module Glib.Graphics {

  export interface BlendStateOptions {
    colorBlendFunction?: number;
    alphaBlendFunction?: number;
    colorSrcBlend?: number;
    alphaSrcBlend?: number;
    colorDstBlend?: number;
    alphaDstBlend?: number;
    constantR?: number;
    constantG?: number;
    constantB?: number;
    constantA?: number;
    enabled?: boolean;
  }
  
  export class BlendState implements BlendStateOptions {
    device:Device;
    gl:any;
    _colorBlendFunction:number = BlendFunction.Add;
    _alphaBlendFunction:number = BlendFunction.Add;
    _colorSrcBlend:number = Blend.One;
    _alphaSrcBlend:number = Blend.One;
    _colorDstBlend:number = Blend.Zero;
    _alphaDstBlend:number = Blend.Zero;
    _constantR:number = 0;
    _constantG:number = 0;
    _constantB:number = 0;
    _constantA:number = 0;
    _enabled:boolean = false;
    _changed:boolean = false;
    _changes:BlendStateOptions = {};

    constructor(device:Device, state?:BlendStateOptions) {
      this.device = device;
      this.gl = device.context;
      this.resolve();
      this.extend(state);
    }

    get colorBlendFunction():number {
      return this._colorBlendFunction;
    }

    get colorBlendFunctionName():string {
      return BlendFunctionName[this._colorBlendFunction];
    }

    set colorBlendFunction(value:number) {
      if (this._colorBlendFunction !== value) {
        this._colorBlendFunction = value;
        this._changes.colorBlendFunction = value;
        this._changed = true;
      }
    }

    get alphaBlendFunction():number {
      return this._alphaBlendFunction;
    }

    get alphaBlendFunctionName():string {
      return BlendFunctionName[this._alphaBlendFunction];
    }

    set alphaBlendFunction(value:number) {
      if (this._alphaBlendFunction !== value) {
        this._alphaBlendFunction = value;
        this._changes.alphaBlendFunction = value;
        this._changed = true;
      }
    }

    get colorSrcBlend():number {
      return this._colorSrcBlend;
    }

    get colorSrcBlendName():string {
      return BlendName[this._colorSrcBlend];
    }

    set colorSrcBlend(value:number) {
      if (this._colorSrcBlend !== value) {
        this._colorSrcBlend = value;
        this._changes.colorSrcBlend = value;
        this._changed = true;
      }
    }

    get alphaSrcBlend():number {
      return this._alphaSrcBlend;
    }

    get alphaSrcBlendName():string {
      return BlendName[this._alphaSrcBlend];
    }

    set alphaSrcBlend(value:number) {
      if (this._alphaSrcBlend !== value) {
        this._alphaSrcBlend = value;
        this._changes.alphaSrcBlend = value;
        this._changed = true;
      }
    }

    get colorDstBlend():number {
      return this._colorDstBlend;
    }

    get colorDstBlendName():string {
      return BlendName[this._colorDstBlend];
    }

    set colorDstBlend(value:number) {
      if (this._colorDstBlend !== value) {
        this._colorDstBlend = value;
        this._changes.colorDstBlend = value;
        this._changed = true;
      }
    }

    get alphaDstBlend():number {
      return this._alphaDstBlend;
    }

    get alphaDstBlendName():string {
      return BlendName[this._alphaDstBlend];
    }

    set alphaDstBlend(value:number) {
      if (this._alphaDstBlend !== value) {
        this._alphaDstBlend = value;
        this._changes.alphaDstBlend = value;
        this._changed = true;
      }
    }

    get constantR():number {
      return this._constantR;
    }

    set constantR(value:number) {
      if (this._constantR !== value) {
        this._constantR = value;
        this._changes.constantR = value;
        this._changed = true;
      }
    }

    get constantG():number {
      return this._constantG;
    }

    set constantG(value:number) {
      if (this._constantG !== value) {
        this._constantG = value;
        this._changes.constantG = value;
        this._changed = true;
      }
    }

    get constantB():number {
      return this._constantB;
    }

    set constantB(value:number) {
      if (this._constantB !== value) {
        this._constantB = value;
        this._changes.constantB = value;
        this._changed = true;
      }
    }

    get constantA():number {
      return this._constantA;
    }

    set constantA(value:number) {
      if (this._constantA !== value) {
        this._constantA = value;
        this._changes.constantA = value;
        this._changed = true;
      }
    }

    get enabled():boolean {
      return this._enabled;
    }

    set enabled(value:boolean) {
      if (this._enabled !== value) {
        this._enabled = value;
        this._changes.enabled = value;
        this._changed = true;
      }
    }

    extend(state:BlendStateOptions={}):BlendState {
      utils.extend(this, state);
      return this
    }

    commit(state?:BlendStateOptions):BlendState {
      this.extend(state);

      if (!this._changed) {
        return this;
      }

      var changes = this._changes;
      if (changes.colorBlendFunction !== undefined || changes.alphaBlendFunction !== undefined) {
        changes.colorBlendFunction = this.colorBlendFunction;
        changes.alphaBlendFunction = this.alphaBlendFunction;
      }

      if (changes.colorSrcBlend !== undefined || changes.colorDstBlend !== undefined || changes.alphaSrcBlend !== undefined || changes.alphaDstBlend !== undefined) {
        changes.colorSrcBlend = this.colorSrcBlend;
        changes.colorDstBlend = this.colorDstBlend;
        changes.alphaSrcBlend = this.alphaSrcBlend;
        changes.alphaDstBlend = this.alphaDstBlend;
      }

      if (changes.constantR !== undefined || changes.constantG !== undefined || changes.constantB !== undefined || changes.constantA !== undefined) {
        changes.constantR = this.constantR;
        changes.constantG = this.constantG;
        changes.constantB = this.constantB;
        changes.constantA = this.constantA;
      }

      BlendState.commit(this.gl, changes);

      this._changed = false;
      this._changes = {};
      return this;
    }

    dump(out?:any):BlendStateOptions {
      out = out || {};
      out.colorBlendFunction = this.colorBlendFunction;
      out.alphaBlendFunction = this.alphaBlendFunction;
      out.colorSrcBlend = this.colorSrcBlend;
      out.alphaSrcBlend = this.alphaSrcBlend;
      out.colorDstBlend = this.colorDstBlend;
      out.alphaDstBlend = this.alphaDstBlend;
      out.constantR = this.constantR;
      out.constantG = this.constantG;
      out.constantB = this.constantB;
      out.constantA = this.constantA;
      out.enabled = this.enabled;
      return out;
    }

    resolve():BlendState {
      BlendState.resolve(this.gl, this);
      this._changed = false;
      this._changes = {};
      return this;
    }

    static resolve(gl:any, out?:any):BlendStateOptions {
      out = out || {};
      out.colorBlendFunction = gl.getParameter(gl.BLEND_EQUATION_RGB);
      out.alphaBlendFunction = gl.getParameter(gl.BLEND_EQUATION_ALPHA);
      out.colorSrcBlend = gl.getParameter(gl.BLEND_SRC_RGB);
      out.alphaSrcBlend = gl.getParameter(gl.BLEND_SRC_ALPHA);
      out.colorDstBlend = gl.getParameter(gl.BLEND_DST_RGB);
      out.alphaDstBlend = gl.getParameter(gl.BLEND_DST_ALPHA);
      var color = gl.getParameter(gl.BLEND_COLOR);
      out.constantR = color[0];
      out.constantG = color[1];
      out.constantB = color[2];
      out.constantA = color[3];
      out.enabled = gl.getParameter(gl.BLEND);
      return out;
    }

    static commit(gl:any, state:BlendStateOptions) {

      var colorBlend = state.colorBlendFunction;
      var alphaBlend = state.alphaBlendFunction;
      if (colorBlend !== undefined && alphaBlend !== undefined) {
        gl.blendEquationSeparate(colorBlend, alphaBlend);
      }

      var colorSrcBlend = state.colorSrcBlend;
      var colorDstBlend = state.colorDstBlend;
      var alphaSrcBlend = state.alphaSrcBlend;
      var alphaDstBlend = state.alphaDstBlend;
      if (colorSrcBlend !== undefined &&
        colorDstBlend !== undefined &&
        alphaSrcBlend !== undefined &&
        alphaDstBlend !== undefined) {
        gl.blendFuncSeparate(colorSrcBlend, colorDstBlend, alphaSrcBlend, alphaDstBlend);
      }

      var constantR = state.constantR;
      var constantG = state.constantG;
      var constantB = state.constantB;
      var constantA = state.constantA;
      if (constantR !== undefined &&
        constantG !== undefined &&
        constantB !== undefined &&
        constantA !== undefined) {
        gl.blendColor(constantR, constantG, constantB, constantA);
      }

      var enabled = state.enabled;
      if (enabled !== undefined) {
        if (enabled) {
          gl.enable(gl.BLEND);
        } else {
          gl.disable(gl.BLEND);
        }
      }
    }

    static convert(state:any):BlendStateOptions {
      if (typeof state === 'string') {
        state = BlendState[state];
      }
      if (!state) {
        return state;
      }
      if (state.colorBlendFunction) {
        state.colorBlendFunction = BlendFunction[state.colorBlendFunction];
      }
      if (state.alphaBlendFunction) {
        state.alphaBlendFunction = BlendFunction[state.alphaBlendFunction];
      }
      if (state.colorSrcBlend) {
        state.colorSrcBlend = Blend[state.colorSrcBlend];
      }
      if (state.alphaSrcBlend) {
        state.alphaSrcBlend = Blend[state.alphaSrcBlend];
      }
      if (state.colorDstBlend) {
        state.colorDstBlend = Blend[state.colorDstBlend];
      }
      if (state.alphaDstBlend) {
        state.alphaDstBlend = Blend[state.alphaDstBlend];
      }
      return state;
    }

    static Default = {
      colorBlendFunction: BlendFunction.Add,
      alphaBlendFunction: BlendFunction.Add,

      colorSrcBlend: Blend.One,
      alphaSrcBlend: Blend.One,
      colorDstBlend: Blend.Zero,
      alphaDstBlend: Blend.Zero,

      constantR: 0,
      constantG: 0,
      constantB: 0,
      constantA: 0,
      enabled: false
    };

    static Additive = {
      colorBlendFunction: BlendFunction.Add,
      alphaBlendFunction: BlendFunction.Add,

      colorSrcBlend: Blend.One,
      alphaSrcBlend: Blend.One,
      colorDstBlend: Blend.One,
      alphaDstBlend: Blend.One,

      constantR: 0,
      constantG: 0,
      constantB: 0,
      constantA: 0,
      enabled: true
    };

    static AlphaBlend = {
      colorBlendFunction: BlendFunction.Add,
      alphaBlendFunction: BlendFunction.Add,

      colorSrcBlend: Blend.SrcAlpha,
      alphaSrcBlend: Blend.SrcAlpha,

      colorDstBlend: Blend.SrcAlphaInv,
      alphaDstBlend: Blend.SrcAlphaInv,

      constantR: 0,
      constantG: 0,
      constantB: 0,
      constantA: 0,
      enabled: true
    };

    static NonPremultiplied = {
      colorBlendFunction: BlendFunction.Add,
      alphaBlendFunction: BlendFunction.Add,

      colorSrcBlend: Blend.SrcAlpha,
      alphaSrcBlend: Blend.SrcAlpha,

      colorDstBlend: Blend.SrcAlphaInv,
      alphaDstBlend: Blend.SrcAlphaInv,

      constantR: 0,
      constantG: 0,
      constantB: 0,
      constantA: 0,
      enabled: true
    }
  }
  Object.freeze(BlendState.Default);
  Object.freeze(BlendState.Additive);
  Object.freeze(BlendState.AlphaBlend);
  Object.freeze(BlendState.NonPremultiplied);
}
