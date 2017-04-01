module Glib.Graphics {

  import debug = Glib.utils.debug;
  import IVec2 = Glib.IVec2;
  import IVec3 = Glib.IVec3;
  import IVec4 = Glib.IVec4;

  function parseArray(string) {
    let result = string.replace(/[\[\]]/g, '').split(',');
    for (let i = 0; i < result.length; i += 1) {
      result[i] = Number(result[i]) || 0;
    }
    return result;
  }

  function makeVec2(data: number[]): IVec2 {
    return {x: data[0] || 0, y: data[1] || 0}
  }

  function makeVec3(data: number[]): IVec3 {
    return {x: data[0] || 0, y: data[1] || 0, z: data[2] || 0}
  }

  function makeVec4(data: number[]): IVec4 {
    return {x: data[0] || 0, y: data[1] || 0, z: data[2] || 0, w: data[3] || 0}
  }

  export interface ShaderUniformOptions {
    name:string
    type:string
    binding?:string
    default?:any
    filter?:string
    register?: number
  }

  /**
   * 
   */
  export class ShaderUniform {
    /**
     * The graphics device
     */
    device:Device
    /**
     * The rendering context
     */
    gl:WebGLRenderingContext
    /**
     * The shader program
     */
    program:ShaderProgram
    /**
     * Meta data and annotations about this uniform 
     */
    meta:any
    /**
     * The binding name of this uniform
     */
    name:string
    /**
     * The type of the uniform variable in the shader
     */
    type:string
    /**
     * The web gl location
     */
    location:WebGLUniformLocation
    /**
     * The default value
     */
    defaultValue:any
    /**
     * The currently cached value
     */
    cachedValue:any[] = []
    dirty: boolean = true

    set:(any, ...rest:any[])=>void
    put:(any, ...rest:any[])=>void
    register: number
    filter: number

    /**
     * 
     */
    constructor(program:ShaderProgram, options:ShaderUniformOptions) {

      this.device = program.device
      this.gl = program.gl

      this.program = program
      this.meta = options
      this.name = options.binding || options.name
      this.type = options.type
      this.location = program.gl.getUniformLocation(program.handle, options.name)
      if (this.location == null) {
        this.set = function () {}
        return
      }

      let value = options['default'];
      switch (this.type) {
        case 'int':
          this.defaultValue = Number(value) || 0
          this.set = this.setInt
          break
        case 'bool':
          this.defaultValue = value === 'true' || value === '1'
          this.set = this.setBool
          break
        case 'float':
          this.defaultValue = Number(value) || 0
          this.set = this.setFloat
          break
        case 'vec2':
          this.defaultValue = makeVec2(parseArray(value || ""))
          this.set = this.setVec2
          break
        case 'vec3':
          this.defaultValue = makeVec3(parseArray(value || ""))
          this.set = this.setVec3
          break
        case 'vec4':
          this.defaultValue = makeVec4(parseArray(value || ""))
          this.set = this.setVec4
          break
        case 'mat4':
          this.set = this.setMat4
          break
        case 'texture':
        case 'texture2D':
        case 'textureCube':
        case 'sampler':
        case 'sampler2D':
        case 'samplerCube':
          this.register = Number(this.meta.register)|0
          this.filter = utils.copy(SamplerState[this.meta.filter] || SamplerState.Default)
          this.set = this.setTexture
          break
        default:
          this.set = function () {}
          break
      }
      if (this.defaultValue !== void 0) {
        this.set(this.defaultValue)
      }
    }

    private cacheValue(x:any, y?:any, z?:any, w?:any): boolean {
      let changed = false
      let cache = this.cachedValue
      for (let i = 0; i < arguments.length; i++) {
        if (cache[i] !== arguments[i]) changed = true
        cache[i] = arguments[i]
      }
      cache.length = arguments.length
      return changed
    }

    /**
     * Sets an int value. Commits it to the uniform variable of the program if it has changed.
     */
    setInt(value: number) {
      if (this.cacheValue(value|0)) {
        this.gl.uniform1i(this.location, value|0)
      }
    }

    /**
     * Sets an int value. Commits it to the uniform variable of the program if it has changed.
     */
    setInt2(v1: number, v2: number) {
      if (this.cacheValue(v1|0, v2|0)) {
        this.gl.uniform2i(this.location, v1|0, v2|0)
      }
    }

    /**
     * Sets an int value. Commits it to the uniform variable of the program if it has changed.
     */
    setInt3(v1: number, v2: number, v3: number) {
      if (this.cacheValue(v1|0, v2|0, v3|0)) {
        this.gl.uniform3i(this.location, v1|0, v2|0, v3|0)
      }
    }

    /**
     * Sets an int value. Commits it to the uniform variable of the program if it has changed.
     */
    setInt4(v1: number, v2: number, v3: number, v4: number) {
      if (this.cacheValue(v1|0, v2|0, v3|0, v4|0)) {
        this.gl.uniform4i(this.location, v1|0, v2|0, v3|0, v4|0)
      }
    }

    /**
     * Sets a boolean value. Commits it to the uniform variable of the program if it has changed.
     */
    setBool(value: boolean) {
      if (this.cacheValue(value)) {
        this.gl.uniform1i(this.location, value ? 1 : 0)
      }
    }

    /**
     * Sets a boolean value. Commits it to the uniform variable of the program if it has changed.
     */
    setBool2(v1: boolean, v2: boolean) {
      if (this.cacheValue(v1, v2)) {
        this.gl.uniform2i(this.location, v1 ? 1 : 0, v2 ? 1 : 0)
      }
    }

    /**
     * Sets a boolean value. Commits it to the uniform variable of the program if it has changed.
     */
    setBool3(v1: boolean, v2: boolean, v3: boolean) {
      if (this.cacheValue(v1, v2, v3)) {
        this.gl.uniform3i(this.location, v1 ? 1 : 0, v2 ? 1 : 0, v3 ? 1 : 0)
      }
    }

    /**
     * Sets a boolean value. Commits it to the uniform variable of the program if it has changed.
     */
    setBool4(v1: boolean, v2: boolean, v3: boolean, v4: boolean) {
      if (this.cacheValue(v1, v2, v3, v4)) {
        this.gl.uniform4i(this.location, v1 ? 1 : 0, v2 ? 1 : 0, v3 ? 1 : 0, v4 ? 1 : 0)
      }
    }

    /**
     * Sets a float value. Commits it to the uniform variable of the program if it has changed.
     */
    setFloat(value: number) {
      if (this.cacheValue(value)) {
        this.gl.uniform1f(this.location, value)
      }
    }

    /**
     * Sets a two component float value. Commits it to the uniform variable of the program if it has changed.
     */
    setFloat2(v1: number, v2: number) {
      if (this.cacheValue(v1, v2)) {
        this.gl.uniform2f(this.location, v1, v2)
      }
    }

    /**
     * Sets a three component float value. Commits it to the uniform variable of the program if it has changed.
     */
    setFloat3(v1: number, v2: number, v3: number) {
      if (this.cacheValue(v1, v2, v3)) {
        this.gl.uniform3f(this.location, v1, v2, v3)
      }
    }

    /**
     * Sets a four component float value. Commits it to the uniform variable of the program if it has changed.
     */
    setFloat4(v1: number, v2: number, v3: number, v4: number) {
      if (this.cacheValue(v1, v2, v3, v4)) {
        this.gl.uniform4f(this.location, v1, v2, v3, v4)
      }
    }

    /**
     * Sets a two component float value. Commits it to the uniform variable of the program if it has changed.
     */
    setVec2(value: IVec2|number[]) {
      if (Array.isArray(value)) {
        if (this.cacheValue(value[0], value[1])) {
          this.gl.uniform2f(this.location, value[0], value[1])
        }
      } else {
        let v = value as IVec2
        if (this.cacheValue(v.x, v.y)) {
          this.gl.uniform2f(this.location, v.x, v.y)
        }
      }
    }

    /**
     * Sets a three component float value. Commits it to the uniform variable of the program if it has changed.
     */
    setVec3(value: IVec3|number[]) {
      if (Array.isArray(value)) {
        if (this.cacheValue(value[0], value[1], value[2])) {
          this.gl.uniform3f(this.location, value[0], value[1], value[2])
        }
      } else {
        let v = value as IVec3
        if (this.cacheValue(v.x, v.y, v.z)) {
          this.gl.uniform3f(this.location, v.x, v.y, v.z)
        }
      }
    }

    /**
     * Sets a four component float value. Commits it to the uniform variable of the program if it has changed.
     */
    setVec4(value: IVec4|number[]) {
      if (Array.isArray(value)) {
        if (this.cacheValue(value[0], value[1], value[2], value[3])) {
          this.gl.uniform4f(this.location, value[0], value[1], value[2], value[3])
        }
      } else {
        let v = value as IVec4
        if (this.cacheValue(v.x, v.y, v.z, v.w)) {
          this.gl.uniform4f(this.location, v.x, v.y, v.z, v.w)
        }
      }
    }

    /**
     * Sets a float array value. Commits it to the uniform. Does not perform or test caching 
     */
    setFloatArray(value: Float32Array) {
      this.cachedValue.length = 0
      this.gl.uniform1fv(this.location, value)
    }
    
    /**
     * Sets a float array value. Commits it to the uniform. Does not perform or test caching 
     */
    setFloat2Array(value: Float32Array) {
      this.cachedValue.length = 0
      this.gl.uniform2fv(this.location, value)
    }

    /**
     * Sets a float array value. Commits it to the uniform. Does not perform or test caching 
     */
    setFloat3Array(value: Float32Array) {
      this.cachedValue.length = 0
      this.gl.uniform3fv(this.location, value)
    }

    /**
     * Sets a float array value. Commits it to the uniform. Does not perform or test caching 
     */
    setFloat4Array(value: Float32Array) {
      this.cachedValue.length = 0
      this.gl.uniform4fv(this.location, value)
    }

    /**
     * Sets a integer array value. Commits it to the uniform. Does not perform or test caching 
     */
    setIntArray(value:Int32Array) {
      this.cachedValue.length = 0
      this.gl.uniform1iv(this.location, value)
    }
    
    /**
     * Sets a integer array value. Commits it to the uniform. Does not perform or test caching 
     */
    setInt2Array(value:Int32Array) {
      this.cachedValue.length = 0
      this.gl.uniform2iv(this.location, value)
    }

    /**
     * Sets a Int array value. Commits it to the uniform. Does not perform or test caching 
     */
    setInt3Array(value:Int32Array) {
      this.cachedValue.length = 0
      this.gl.uniform3iv(this.location, value)
    }

    /**
     * Sets a Int array value. Commits it to the uniform. Does not perform or test caching 
     */
    setInt4Array(value:Int32Array) {
      this.cachedValue.length = 0
      this.gl.uniform4iv(this.location, value)
    }

    /**
     * Sets a 2x2 matrix value on the uniform. Does not perform or test caching
     */
    setMat2(value:IMat, transpose: boolean) {
      this.cachedValue.length = 0
      this.gl.uniformMatrix2fv(this.location, !!transpose, value.data)
    }

    /**
     * Sets a 3x3 matrix value on the uniform. Does not perform or test caching
     */
    setMat3(value:IMat, transpose: boolean) {
      this.cachedValue.length = 0
      this.gl.uniformMatrix3fv(this.location, !!transpose, value.data)
    }

    /**
     * Sets a 4x4 matrix value on the uniform. Does not perform or test caching
     */
    setMat4(value:IMat, transpose: boolean) {
      this.cachedValue.length = 0
      this.gl.uniformMatrix4fv(this.location, !!transpose, value.data)
    }

    /**
     * Binds a texture to this uniform
     */
    setTexture(value: Texture) {
      let device = this.device
      let sampler = device.samplerStates[this.register] || device.samplerStates[0]

      if (value) {
        value.update()
      } 
      // TODO: find petter place/solution for this logic
      if (!value || !value.ready) {
        sampler.texture = this.device.defaultTexture
      } else {
        sampler.texture = value
      }
      sampler.commit(this.filter)
      this.setInt(sampler.register)
    }
  }
}
