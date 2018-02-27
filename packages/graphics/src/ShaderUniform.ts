// tslint:disable:no-bitwise

import { copy } from '@glib/core'
import { Device } from './Device'
import { ShaderProgram } from './ShaderProgram'
import { SamplerState, SamplerStateProperties } from './states'
import { Texture } from './Texture'

function parseArray(value: string) {
  let result: any = value.replace(/[\[\]]/g, '').split(',')
  for (let i = 0; i < result.length; i += 1) {
    result[i] = Number(result[i]) || 0
  }
  return result
}

function makeVec2(data: number[]) {
  return {x: data[0] || 0, y: data[1] || 0}
}

function makeVec3(data: number[]) {
  return {x: data[0] || 0, y: data[1] || 0, z: data[2] || 0}
}

function makeVec4(data: number[]) {
  return {x: data[0] || 0, y: data[1] || 0, z: data[2] || 0, w: data[3] || 0}
}

export interface ShaderUniformOptions {
  name: string
  type: string
  binding?: string
  default?: any
  filter?: string
  register?: number
}

/**
 *
 */
export class ShaderUniform {
  /**
   * The graphics device
   */
  public device: Device
  /**
   * The rendering context
   */
  public gl: WebGLRenderingContext
  /**
   * The shader program
   */
  public program: ShaderProgram
  /**
   * Meta data and annotations about this uniform
   */
  public meta: any
  /**
   * The binding name of this uniform
   */
  public name: string
  /**
   * The type of the uniform variable in the shader
   */
  public type: string
  /**
   * The web gl location
   */
  public location: WebGLUniformLocation
  /**
   * The default value
   */
  public defaultValue: any
  /**
   * The currently cached value
   */
  public cachedValue: any[] = []
  public dirty: boolean = true

  public set: (v: any, ...rest: any[]) => void
  public put: (v: any, ...rest: any[]) => void
  public register: number
  public filter: SamplerStateProperties

  /**
   *
   */
  constructor(program: ShaderProgram, options: ShaderUniformOptions) {

    this.device = program.device
    this.gl = program.gl

    this.program = program
    this.meta = options
    this.name = options.binding || options.name
    this.type = options.type
    this.location = program.gl.getUniformLocation(program.handle, options.name)
    if (this.location == null) {
      this.set = () => { /* */ }
      return
    }

    let value = options['default']
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
        this.defaultValue = makeVec2(parseArray(value || ''))
        this.set = this.setVec2
        break
      case 'vec3':
        this.defaultValue = makeVec3(parseArray(value || ''))
        this.set = this.setVec3
        break
      case 'vec4':
        this.defaultValue = makeVec4(parseArray(value || ''))
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

        this.register = Number(this.meta.register) | 0
        this.filter = copy(SamplerState[this.meta.filter] || SamplerState.Default)
        this.set = this.setTexture
        break
      default:
        this.set = () => { /* */ }
        break
    }
    if (this.defaultValue !== void 0) {
      this.set(this.defaultValue)
    }
  }

  private cacheValue(x: any, y?: any, z?: any, w?: any): boolean {
    let changed = false
    let cache = this.cachedValue
    for (let i = 0; i < arguments.length; i++) {
      if (cache[i] !== arguments[i]) { changed = true }
      cache[i] = arguments[i]
    }
    cache.length = arguments.length
    return changed
  }

  /**
   * Sets an int value. Commits it to the uniform variable of the program if it has changed.
   */
  public setInt(value: number) {
    if (this.cacheValue(value | 0)) {
      this.gl.uniform1i(this.location, value | 0)
    }
  }

  /**
   * Sets an int value. Commits it to the uniform variable of the program if it has changed.
   */
  public setInt2(v1: number, v2: number) {
    if (this.cacheValue(v1 | 0, v2 | 0)) {
      this.gl.uniform2i(this.location, v1 | 0, v2 | 0)
    }
  }

  /**
   * Sets an int value. Commits it to the uniform variable of the program if it has changed.
   */
  public setInt3(v1: number, v2: number, v3: number) {
    if (this.cacheValue(v1 | 0, v2 | 0, v3 | 0)) {
      this.gl.uniform3i(this.location, v1 | 0, v2 | 0, v3 | 0)
    }
  }

  /**
   * Sets an int value. Commits it to the uniform variable of the program if it has changed.
   */
  public setInt4(v1: number, v2: number, v3: number, v4: number) {
    if (this.cacheValue(v1 | 0, v2 | 0, v3 | 0, v4 | 0)) {
      this.gl.uniform4i(this.location, v1 | 0, v2 | 0, v3 | 0, v4 | 0)
    }
  }

  /**
   * Sets a boolean value. Commits it to the uniform variable of the program if it has changed.
   */
  public setBool(value: boolean) {
    if (this.cacheValue(value)) {
      this.gl.uniform1i(this.location, value ? 1 : 0)
    }
  }

  /**
   * Sets a boolean value. Commits it to the uniform variable of the program if it has changed.
   */
  public setBool2(v1: boolean, v2: boolean) {
    if (this.cacheValue(v1, v2)) {
      this.gl.uniform2i(this.location, v1 ? 1 : 0, v2 ? 1 : 0)
    }
  }

  /**
   * Sets a boolean value. Commits it to the uniform variable of the program if it has changed.
   */
  public setBool3(v1: boolean, v2: boolean, v3: boolean) {
    if (this.cacheValue(v1, v2, v3)) {
      this.gl.uniform3i(this.location, v1 ? 1 : 0, v2 ? 1 : 0, v3 ? 1 : 0)
    }
  }

  /**
   * Sets a boolean value. Commits it to the uniform variable of the program if it has changed.
   */
  public setBool4(v1: boolean, v2: boolean, v3: boolean, v4: boolean) {
    if (this.cacheValue(v1, v2, v3, v4)) {
      this.gl.uniform4i(this.location, v1 ? 1 : 0, v2 ? 1 : 0, v3 ? 1 : 0, v4 ? 1 : 0)
    }
  }

  /**
   * Sets a float value. Commits it to the uniform variable of the program if it has changed.
   */
  public setFloat(value: number) {
    if (this.cacheValue(value)) {
      this.gl.uniform1f(this.location, value)
    }
  }

  /**
   * Sets a two component float value. Commits it to the uniform variable of the program if it has changed.
   */
  public setFloat2(v1: number, v2: number) {
    if (this.cacheValue(v1, v2)) {
      this.gl.uniform2f(this.location, v1, v2)
    }
  }

  /**
   * Sets a three component float value. Commits it to the uniform variable of the program if it has changed.
   */
  public setFloat3(v1: number, v2: number, v3: number) {
    if (this.cacheValue(v1, v2, v3)) {
      this.gl.uniform3f(this.location, v1, v2, v3)
    }
  }

  /**
   * Sets a four component float value. Commits it to the uniform variable of the program if it has changed.
   */
  public setFloat4(v1: number, v2: number, v3: number, v4: number) {
    if (this.cacheValue(v1, v2, v3, v4)) {
      this.gl.uniform4f(this.location, v1, v2, v3, v4)
    }
  }

  /**
   * Sets a two component float value. Commits it to the uniform variable of the program if it has changed.
   */
  public setVec2(value: {x: number, y: number}|number[]) {
    if (Array.isArray(value)) {
      if (this.cacheValue(value[0], value[1])) {
        this.gl.uniform2f(this.location, value[0], value[1])
      }
    } else {
      if (this.cacheValue(value.x, value.y)) {
        this.gl.uniform2f(this.location, value.x, value.y)
      }
    }
  }

  /**
   * Sets a three component float value. Commits it to the uniform variable of the program if it has changed.
   */
  public setVec3(value: {x: number, y: number, z: number}|number[]) {
    if (Array.isArray(value)) {
      if (this.cacheValue(value[0], value[1], value[2])) {
        this.gl.uniform3f(this.location, value[0], value[1], value[2])
      }
    } else {
      if (this.cacheValue(value.x, value.y, value.z)) {
        this.gl.uniform3f(this.location, value.x, value.y, value.z)
      }
    }
  }

  /**
   * Sets a four component float value. Commits it to the uniform variable of the program if it has changed.
   */
  public setVec4(value: {x: number, y: number, z: number, w: number}|number[]) {
    if (Array.isArray(value)) {
      if (this.cacheValue(value[0], value[1], value[2], value[3])) {
        this.gl.uniform4f(this.location, value[0], value[1], value[2], value[3])
      }
    } else {
      if (this.cacheValue(value.x, value.y, value.z, value.w)) {
        this.gl.uniform4f(this.location, value.x, value.y, value.z, value.w)
      }
    }
  }

  /**
   * Sets a float array value. Commits it to the uniform. Does not perform or test caching
   */
  public setFloatArray(value: Float32Array) {
    this.cachedValue.length = 0
    this.gl.uniform1fv(this.location, value)
  }

  /**
   * Sets a float array value. Commits it to the uniform. Does not perform or test caching
   */
  public setFloat2Array(value: Float32Array) {
    this.cachedValue.length = 0
    this.gl.uniform2fv(this.location, value)
  }

  /**
   * Sets a float array value. Commits it to the uniform. Does not perform or test caching
   */
  public setFloat3Array(value: Float32Array) {
    this.cachedValue.length = 0
    this.gl.uniform3fv(this.location, value)
  }

  /**
   * Sets a float array value. Commits it to the uniform. Does not perform or test caching
   */
  public setFloat4Array(value: Float32Array) {
    this.cachedValue.length = 0
    this.gl.uniform4fv(this.location, value)
  }

  /**
   * Sets a integer array value. Commits it to the uniform. Does not perform or test caching
   */
  public setIntArray(value: Int32Array) {
    this.cachedValue.length = 0
    this.gl.uniform1iv(this.location, value)
  }

  /**
   * Sets a integer array value. Commits it to the uniform. Does not perform or test caching
   */
  public setInt2Array(value: Int32Array) {
    this.cachedValue.length = 0
    this.gl.uniform2iv(this.location, value)
  }

  /**
   * Sets a Int array value. Commits it to the uniform. Does not perform or test caching
   */
  public setInt3Array(value: Int32Array) {
    this.cachedValue.length = 0
    this.gl.uniform3iv(this.location, value)
  }

  /**
   * Sets a Int array value. Commits it to the uniform. Does not perform or test caching
   */
  public setInt4Array(value: Int32Array) {
    this.cachedValue.length = 0
    this.gl.uniform4iv(this.location, value)
  }

  /**
   * Sets a 2x2 matrix value on the uniform. Does not perform or test caching
   */
  public setMat2(value: { data: number[]|Float32Array }, transpose: boolean) {
    this.cachedValue.length = 0
    this.gl.uniformMatrix2fv(this.location, !!transpose, value.data)
  }

  /**
   * Sets a 3x3 matrix value on the uniform. Does not perform or test caching
   */
  public setMat3(value: { data: number[]|Float32Array }, transpose: boolean) {
    this.cachedValue.length = 0
    this.gl.uniformMatrix3fv(this.location, !!transpose, value.data)
  }

  /**
   * Sets a 4x4 matrix value on the uniform. Does not perform or test caching
   */
  public setMat4(value: { data: number[]|Float32Array }, transpose: boolean) {
    this.cachedValue.length = 0
    this.gl.uniformMatrix4fv(this.location, !!transpose, value.data)
  }

  /**
   * Binds a texture to this uniform
   */
  public setTexture(value: Texture) {
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
