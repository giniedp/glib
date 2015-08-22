module Glib.Graphics {

  import debug = Glib.utils.debug;
  import IVec2 = Vlib.IVec2;
  import IVec3 = Vlib.IVec3;
  import IVec4 = Vlib.IVec4;

  function parseArray(string) {
    var result = string.replace(/[\[\]]/g, '').split(',');
    for (var i = 0; i < result.length; i += 1) {
      result[i] = Number(result[i]) || 0;
    }
    return result;
  }

  function makeVec2(data:number[]):IVec2 {
    return {x: data[0] || 0, y: data[1] || 0}
  }

  function makeVec3(data:number[]):IVec3 {
    return {x: data[0] || 0, y: data[1] || 0, z: data[2] || 0}
  }

  function makeVec4(data:number[]):IVec4 {
    return {x: data[0] || 0, y: data[1] || 0, z: data[2] || 0, w: data[3] || 0}
  }

  export interface Vec2 {
    x: number
    y: number
  }
  export interface Vec3 extends Vec2 {
    z: number
  }
  export interface Vec4 extends Vec3 {
    w: number
  }
  export interface Mat4 {
    data: number[]
  }

  export class ShaderUniform {
    device:Device;
    gl:any;
    program:ShaderProgram;
    meta:any;
    name:string;
    type:string;
    location:WebGLUniformLocation;
    'default':any;
    set:(any, ...rest:any[])=>void;
    register:number;
    filter:number;

    constructor(program:ShaderProgram, name:string, meta:any) {
      meta = meta || {};

      this.device = program.device;
      this.gl = program.gl;

      this.program = program;
      this.meta = meta || {};
      this.name = meta.name || name;
      this.type = meta.type;
      this.location = program.gl.getUniformLocation(program.handle, this.name);

      if (this.location == null) {
        debug(`Uniform '${this.name}' not found in shader.`, this);
        this.set = function () {};
        return;
      }

      var value = this.meta['default'];
      switch (this.type) {
        case 'int':
          this['default'] = Number(value) || 0;
          this.set = this.setInt;
          break;
        case 'bool':
          this['default'] = value === 'true' || value === '1';
          this.set = this.setBool;
          break;
        case 'float':
          this['default'] = Number(value) || 0;
          this.set = this.setFloat;
          break;
        case 'vec2':
          this['default'] = makeVec2(parseArray(value || ""));
          this.set = this.setVec2;
          break;
        case 'vec3':
          this['default'] = makeVec3(parseArray(value || ""));
          this.set = this.setVec3;
          break;
        case 'vec4':
          this['default'] = makeVec4(parseArray(value || ""));
          this.set = this.setVec4;
          break;
        case 'mat4':
          this.set = this.setMat4;
          break;
        case 'texture':
        case 'texture2D':
        case 'textureCube':
        case 'sampler':
        case 'sampler2D':
        case 'samplerCube':
          this.register = Number(this.meta.register) || 0;
          this.filter = utils.copy(SamplerState[meta.filter] || SamplerState.Default);
          this.set = this.setTexture;
          break;
        default:
          this.set = function () {};
          break;
      }
      if (this['default']) {
        this.set(this['default']);
      }
    }

    setInt(value:number) {
      this.gl.uniform1i(this.location, value | 0);
    }

    setBool(value:boolean) {
      this.gl.uniform1i(this.location, !!value ? 1 : 0);
    }

    setFloat(value:number) {
      this.gl.uniform1f(this.location, value);
    }

    setFloat2(value:number[]) {
      this.gl.uniform2f(this.location, value[0], value[1]);
    }

    setFloat3(value:number[]) {
      this.gl.uniform3f(this.location, value[0], value[1], value[2]);
    }

    setFloat4(value:number[]) {
      this.gl.uniform4f(this.location, value[0], value[1], value[2], value[4]);
    }

    setVec2(value:Vec2|number[]) {
      if (value["x"] !== undefined) {
        this.gl.uniform2f(this.location, value["x"], value["y"]);  
      } else {
        this.gl.uniform2f(this.location, value[0], value[1]);
      }
    }

    setVec3(value:Vec3|number[]) {
      if (value["x"] !== undefined) {
        this.gl.uniform3f(this.location, value["x"], value["y"], value["z"]);  
      } else {
        this.gl.uniform3f(this.location, value[0], value[1], value[2]);
      }
    }

    setVec4(value:Vec4|number[]) {
      if (value["x"] !== undefined) {
        this.gl.uniform4f(this.location, value["x"], value["y"], value["z"], value["w"]);  
      } else {
        this.gl.uniform4f(this.location, value[0], value[1], value[2], value[3]);
      }
    }

    setMat4(value:Mat4, transpose:boolean) {
      this.gl.uniformMatrix4fv(this.location, !!transpose, value.data);
    }

    setTexture(value:Texture) {
      if (value.update) {
        value.update();
      }
      if (!value.ready) {
        return;
      }

      var device = this.device;
      var sampler = device.sampler[this.register] || device.sampler[0];
      sampler.texture = value;
      utils.extend(sampler, this.filter);
      sampler.commit();
      this.gl.uniform1i(this.location, sampler.register);
    }
  }
}
