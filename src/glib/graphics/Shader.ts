module Glib.Graphics {

  export interface ShaderOptions {
    source?: string,
    type?: string|number,
    handle?: WebGLShader
  }

  export class Shader {
    device:Device;
    gl:any;
    source:string;
    info:string;
    type:number;
    typeName:string;
    handle:WebGLShader;
    compiled:boolean;

    constructor(device:Device, params?:ShaderOptions) {
      params = params || {};
      this.device = device;
      this.gl = device.context;

      this.source = params.source;
      this.type = ShaderType[params.type];
      this.typeName = ShaderTypeName[this.type];

      if (!this.typeName) {
        utils.log(this, 'unknown shader type given', params.type);
      }

      this.handle = params.handle;
      if (!this.handle || !this.gl.isShader(this.handle)) {
        this.handle = this.gl.createShader(this.type);
      }

      if (this.source) {
        this.compile();
      }
    }

    destroy():Shader {
      if (this.gl.isShader(this.handle)) {
        this.gl.deleteShader(this.handle);
        this.handle = null;
      }
      return this;
    }

    compile():Shader {
      if (!this.source) {
        utils.log(this, 'Unable to compile shader, source is missing');
        return this;
      }

      this.gl.shaderSource(this.handle, this.source);
      this.gl.compileShader(this.handle);
      this.compiled = this.gl.getShaderParameter(this.handle, this.gl.COMPILE_STATUS);
      this.info = this.gl.getShaderInfoLog(this.handle);

      if (!this.compiled) {
        utils.log(this, 'Shader compilation failed');
        utils.log(this.info);
      }
      return this;
    }
  }
}