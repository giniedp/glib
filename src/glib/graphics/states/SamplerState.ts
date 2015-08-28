module Glib.Graphics {

  // lookup table for texture unit constants
  // GL.TEXTURE0
  // GL.TEXTURE...
  // GL.TEXTURE31
  var TextureUnitMap = [
    0x84C0, 0x84C1, 0x84C2, 0x84C3,
    0x84C4, 0x84C5, 0x84C6, 0x84C7,
    0x84C8, 0x84C9, 0x84CA, 0x84CB,
    0x84CC, 0x84CD, 0x84CE, 0x84CF,
    0x84D0, 0x84D1, 0x84D2, 0x84D3,
    0x84D4, 0x84D5, 0x84D6, 0x84D7,
    0x84D8, 0x84D9, 0x84DA, 0x84DB,
    0x84DC, 0x84DD, 0x84DE, 0x84DF
  ];

  export interface SamplerStateProperties {
    texture?: any;
    minFilter?: number;
    magFilter?: number;
    wrapU?: number;
    wrapV?: number;
    register?: number;
  }

  export class SamplerState implements SamplerStateProperties {
    device:Device;
    gl:any;
    register:number;
    autofixNonPOT:boolean = true;
    _texture:any;
    _minFilter:number = TextureFilter.PointMipLinear;
    _magFilter:number = TextureFilter.Point;
    _wrapU:number = TextureWrapMode.Clamp;
    _wrapV:number = TextureWrapMode.Clamp;
    _changed:boolean;
    _changes:SamplerStateProperties = {};

    constructor(device:Device, register:number) {
      this.device = device;
      this.gl = device.context;
      this.register = register;
    }

    get texture():any {
      return this._texture;
    }

    set texture(value:any) {
      var texture = this._texture;
      if (texture !== value || (value && (texture.handle !== value.handle || texture.type !== value.type))) {
        this._texture = value;
        this._changes.texture = value;
        this._changed = true;
      }
    }

    get minFilter():number {
      return this._minFilter;
    }

    get minFilterName():string {
      return TextureFilterName[this._minFilter];
    }

    set minFilter(value:number) {
      if (this._minFilter !== value) {
        this._minFilter = value;
        this._changes.minFilter = value;
        this._changed = true;
      }
    }


    get magFilter():number {
      return this._magFilter;
    }

    get magFilterName():string {
      return TextureFilterName[this._magFilter];
    }

    set magFilter(value:number) {
      if (this._magFilter !== value) {
        this._magFilter = value;
        this._changes.magFilter = value;
        this._changed = true;
      }
    }

    get wrapU():number {
      return this._wrapU;
    }

    get wrapUName():string {
      return TextureWrapModeName[this._wrapU];
    }

    set wrapU(value:number) {
      if (this._wrapU !== value) {
        this._wrapU = value;
        this._changes.wrapU = value;
        this._changed = true;
      }
    }

    get wrapV():number {
      return this._wrapV;
    }

    get wrapVName():string {
      return TextureWrapModeName[this._wrapV];
    }

    set wrapV(value:number) {
      if (this._wrapV !== value) {
        this._wrapV = value;
        this._changes.wrapV = value;
        this._changed = true;
      }
    }

    commit(state?:SamplerStateProperties):SamplerState {
      if (state) {
        utils.extend(this, state);
      }
      if (!this._changed) {
        return;
      }

      var texture = this.texture;

      if (!texture) {
        SamplerState.commit(this.gl, this);
        return;
      }

      if (!texture.isPOT && this.autofixNonPOT) {
        SamplerState.fixNonPowerOfTwo(this);
      }

      SamplerState.commit(this.gl, this);

      return this;
    }

    static commit(gl:any, state:SamplerStateProperties) {
      var texture = state.texture;
      var unit = TextureUnitMap[state.register];
      var minFilter = state.minFilter;
      var magFilter = state.magFilter;
      var wrapU = state.wrapU;
      var wrapV = state.wrapV;
      var type = texture ? texture.type : gl.TEXTURE_2D;
      var handle = texture ? texture.handle : null;
      
      gl.activeTexture(unit);
      gl.bindTexture(type, handle);

      if (!texture) {
        return;
      }
      
      if (minFilter !== undefined) {
        gl.texParameteri(type, gl.TEXTURE_MIN_FILTER, minFilter);
      }

      if (magFilter !== undefined) {
        gl.texParameteri(type, gl.TEXTURE_MAG_FILTER, magFilter);
      }

      if (wrapU !== undefined) {
        gl.texParameteri(type, gl.TEXTURE_WRAP_S, wrapU);
      }

      if (wrapV !== undefined) {
        gl.texParameteri(type, gl.TEXTURE_WRAP_T, wrapV);
      }
    }

    static convert(state:any):SamplerStateProperties {
      if (state.minFilter) {
        state.minFilter = TextureFilter[state.minFilter];
      }
      if (state.magFilter) {
        state.magFilter = TextureFilter[state.magFilter];
      }
      if (state.wrapU) {
        state.wrapU = TextureWrapMode[state.wrapU];
      }
      if (state.wrapV) {
        state.wrapV = TextureWrapMode[state.wrapV];
      }
      return state;
    }

    static fixNonPowerOfTwo(state:SamplerStateProperties):SamplerStateProperties {
      state.wrapU = TextureWrapMode.Clamp;
      state.wrapV = TextureWrapMode.Clamp;

      state.magFilter = TextureFilter.Linear;

      if (state.minFilter === TextureFilter.LinearMipLinear ||
        state.minFilter === TextureFilter.LinearMipPoint) {
        state.minFilter = TextureFilter.Linear;
      }
      else if (state.minFilter === TextureFilter.PointMipLinear ||
        state.minFilter === TextureFilter.PointMipLinear) {
        state.minFilter = TextureFilter.Point;
      }

      if (state.magFilter === TextureFilter.LinearMipLinear ||
        state.magFilter === TextureFilter.LinearMipPoint) {
        state.magFilter = TextureFilter.Linear;
      }
      else if (state.magFilter === TextureFilter.PointMipLinear ||
        state.magFilter === TextureFilter.PointMipLinear) {
        state.magFilter = TextureFilter.Point;
      }
      return state;
    }

    static Default = {
      minFilter: TextureFilter.PointMipLinear,
      magFilter: TextureFilter.Point,
      wrapU: TextureWrapMode.Clamp,
      wrapV: TextureWrapMode.Clamp
    };

    static LinearClamp = {
      minFilter: TextureFilter.LinearMipLinear,
      magFilter: TextureFilter.Linear,
      wrapU: TextureWrapMode.Clamp,
      wrapV: TextureWrapMode.Clamp
    };

    static LinearWrap = {
      minFilter: TextureFilter.LinearMipLinear,
      magFilter: TextureFilter.Linear,
      wrapU: TextureWrapMode.Repeat,
      wrapV: TextureWrapMode.Repeat
    };

    static PointClamp = {
      minFilter: TextureFilter.PointMipLinear,
      magFilter: TextureFilter.Point,
      wrapU: TextureWrapMode.Clamp,
      wrapV: TextureWrapMode.Clamp
    };

    static PointWrap = {
      minFilter: TextureFilter.PointMipLinear,
      magFilter: TextureFilter.Point,
      wrapU: TextureWrapMode.Repeat,
      wrapV: TextureWrapMode.Repeat
    };
  }
  Object.freeze(SamplerState.Default);
  Object.freeze(SamplerState.LinearClamp);
  Object.freeze(SamplerState.LinearWrap);
  Object.freeze(SamplerState.PointClamp);
  Object.freeze(SamplerState.PointWrap);
}
