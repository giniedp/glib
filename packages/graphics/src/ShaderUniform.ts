// tslint:disable:no-bitwise

import { IMat, IVec2, IVec3, IVec4 } from '@gglib/math'
import { copy } from '@gglib/utils'
import { Device } from './Device'
import { ShaderProgram } from './ShaderProgram'
import { SamplerState, SamplerStateParams } from './states'
import { Texture } from './Texture'

/**
 * A union type combining all types that are supported by the {@link ShaderUniform}
 *
 * @public
 */
export type ShaderUniformValue = string | boolean | number | ArrayLike<number> | Texture | IVec2 | IVec3 | IVec4 | IMat

/**
 * @public
 */
export interface ShaderUniformBinding<T extends ShaderUniformValue = ShaderUniformValue> {
  /**
   * The shader uniform (binding) name
   */
  name: string
  /**
   * The shader uniform type
   */
  type: string
  /**
   * The value to be set to bound uniform
   */
  value: T
}

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

/**
 * Constructor options for {@link ShaderUniform}
 * @public
 */
export interface ShaderUniformOptions {
  /**
   * The original name of the uniform as it appears in the shader source code
   *
   * @remarks
   * This is used to get the uniform location in the compiled program
   */
  name: string
  /**
   * The type of the uniform e.g. `float`, `vec2`, `vec3`, `mat4`
   */
  type: string
  /**
   * The binding name of the uniform by which the uniform will be accessible in the javascript world
   *
   * @remarks
   * Bindings are defined in the shader source code by adding a comment above a uniform e.g.
   *
   * ```
   * // @binding lightDirection
   * uniform vec3 uLightDirection;
   * ```
   */
  binding?: string
  /**
   * The default value of the uniform that will be set initially
   *
   * @remarks
   * Default values are defined in the shader source code by adding a comment above a uniform e.g.
   *
   * ```glsl
   * // @default [1, 1, 1]
   * uniform vec3 uLightDirection;
   * ```
   */
  default?: any
  /**
   * The sampler state preset name e.g. 'LinearClamp', 'LinearWrap', 'PointClamp' or 'PointWrap'
   *
   * @remarks
   * Filters are defined in the shader source code by adding a comment above a uniform e.g.
   *
   * ```glsl
   * // @filter LinearWrap
   * uniform sampler2d uTexture
   * ```
   */
  filter?: string
  /**
   * This is the sampler register index
   *
   * @remarks
   * Register index is defined in the shader source code by adding a comment above a uniform e.g.
   *
   * ```glsl
   * // @register 2
   * uniform sampler2d uTexture;
   * ```
   */
  register?: number
}

/**
 * @public
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
   * Meta data and annotations of this uniform
   */
  public meta: any
  /**
   * The binding name of this uniform
   */
  public name: string
  /**
   * The type name of the uniform in the shader
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

  /**
   * The texture register index
   */
  public register: number
  /**
   * The texture sampler parameters
   */
  public filter: SamplerStateParams

  /**
   * Instantiates the {@link ShaderUniform}
   */
  constructor(program: ShaderProgram, options: ShaderUniformOptions) {

    this.device = program.device
    this.gl = this.device.context

    this.program = program
    this.meta = options
    this.name = options.binding || options.name
    this.type = options.type
    this.location = this.device.context.getUniformLocation(program.handle, options.name)
    if (this.location == null) {
      this.set = () => { /* */ }
      return
    }

    let value = options.default
    switch (this.type) {
      case 'int':
        this.defaultValue = Number(value) || 0
        this.set = this.setInt
        break
      case 'bool':
        this.defaultValue = value === 'true' || value === '1' || value === 1
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

  private cacheX(x: number | boolean): boolean {
    let changed = false
    let cache = this.cachedValue
    if (cache[0] !== x) {
      cache[0] = x
      changed = true
    }
    cache.length = 1
    return changed
  }

  private cacheXY(x: number | boolean, y: number | boolean): boolean {
    let changed = false
    let cache = this.cachedValue
    if (cache[0] !== x) {
      cache[0] = x
      changed = true
    }
    if (cache[1] !== y) {
      cache[1] = y
      changed = true
    }
    cache.length = 2
    return changed
  }

  private cacheXYZ(x: number | boolean, y: number | boolean, z: number | boolean): boolean {
    let changed = false
    let cache = this.cachedValue
    if (cache[0] !== x) {
      cache[0] = x
      changed = true
    }
    if (cache[1] !== y) {
      cache[1] = y
      changed = true
    }
    if (cache[2] !== z) {
      cache[2] = z
      changed = true
    }
    cache.length = 3
    return changed
  }

  private cacheXYZW(x: number | boolean, y: number | boolean, z: number | boolean, w: number | boolean): boolean {
    let changed = false
    let cache = this.cachedValue
    if (cache[0] !== x) {
      cache[0] = x
      changed = true
    }
    if (cache[1] !== y) {
      cache[1] = y
      changed = true
    }
    if (cache[2] !== z) {
      cache[2] = z
      changed = true
    }
    if (cache[3] !== w) {
      cache[3] = w
      changed = true
    }
    cache.length = 4
    return changed
  }

  /**
   * Sets an int value. Commits it to the uniform variable of the program if it has changed.
   */
  public setInt(value: number) {
    if (this.cacheX(value | 0)) {
      this.gl.uniform1i(this.location, value | 0)
    }
  }

  /**
   * Sets an int2 value. Commits it to the uniform variable of the program if it has changed.
   */
  public setInt2(v1: number, v2: number) {
    if (this.cacheXY(v1 | 0, v2 | 0)) {
      this.gl.uniform2i(this.location, v1 | 0, v2 | 0)
    }
  }

  /**
   * Sets an int3 value. Commits it to the uniform variable of the program if it has changed.
   */
  public setInt3(v1: number, v2: number, v3: number) {
    if (this.cacheXYZ(v1 | 0, v2 | 0, v3 | 0)) {
      this.gl.uniform3i(this.location, v1 | 0, v2 | 0, v3 | 0)
    }
  }

  /**
   * Sets an int4 value. Commits it to the uniform variable of the program if it has changed.
   */
  public setInt4(v1: number, v2: number, v3: number, v4: number) {
    if (this.cacheXYZW(v1 | 0, v2 | 0, v3 | 0, v4 | 0)) {
      this.gl.uniform4i(this.location, v1 | 0, v2 | 0, v3 | 0, v4 | 0)
    }
  }

  /**
   * Sets a boolean value. Commits it to the uniform variable of the program if it has changed.
   */
  public setBool(value: boolean) {
    if (this.cacheX(value)) {
      this.gl.uniform1i(this.location, value ? 1 : 0)
    }
  }

  /**
   * Sets a boolean2 value. Commits it to the uniform variable of the program if it has changed.
   */
  public setBool2(v1: boolean, v2: boolean) {
    if (this.cacheXY(v1, v2)) {
      this.gl.uniform2i(this.location, v1 ? 1 : 0, v2 ? 1 : 0)
    }
  }

  /**
   * Sets a boolean3 value. Commits it to the uniform variable of the program if it has changed.
   */
  public setBool3(v1: boolean, v2: boolean, v3: boolean) {
    if (this.cacheXYZ(v1, v2, v3)) {
      this.gl.uniform3i(this.location, v1 ? 1 : 0, v2 ? 1 : 0, v3 ? 1 : 0)
    }
  }

  /**
   * Sets a boolean4 value. Commits it to the uniform variable of the program if it has changed.
   */
  public setBool4(v1: boolean, v2: boolean, v3: boolean, v4: boolean) {
    if (this.cacheXYZW(v1, v2, v3, v4)) {
      this.gl.uniform4i(this.location, v1 ? 1 : 0, v2 ? 1 : 0, v3 ? 1 : 0, v4 ? 1 : 0)
    }
  }

  /**
   * Sets a float value. Commits it to the uniform variable of the program if it has changed.
   */
  public setFloat(value: number) {
    if (this.cacheX(value)) {
      this.gl.uniform1f(this.location, value)
    }
  }

  /**
   * Sets a two component float value. Commits it to the uniform variable of the program if it has changed.
   */
  public setFloat2(v1: number, v2: number) {
    if (this.cacheXY(v1, v2)) {
      this.gl.uniform2f(this.location, v1, v2)
    }
  }

  /**
   * Sets a three component float value. Commits it to the uniform variable of the program if it has changed.
   */
  public setFloat3(v1: number, v2: number, v3: number) {
    if (this.cacheXYZ(v1, v2, v3)) {
      this.gl.uniform3f(this.location, v1, v2, v3)
    }
  }

  /**
   * Sets a four component float value. Commits it to the uniform variable of the program if it has changed.
   */
  public setFloat4(v1: number, v2: number, v3: number, v4: number) {
    if (this.cacheXYZW(v1, v2, v3, v4)) {
      this.gl.uniform4f(this.location, v1, v2, v3, v4)
    }
  }

  /**
   * Sets a two component float value. Commits it to the uniform variable of the program if it has changed.
   */
  public setVec2(value: {x: number, y: number} | ArrayLike<number>) {
    if (value['x'] != null) {
      if (this.cacheXY(value['x'], value['y'])) {
        this.gl.uniform2f(this.location, value['x'], value['y'])
      }
    } else {
      if (this.cacheXY(value[0], value[1])) {
        this.gl.uniform2f(this.location, value[0], value[1])
      }
    }
  }

  /**
   * Sets a three component float value. Commits it to the uniform variable of the program if it has changed.
   */
  public setVec3(value: {x: number, y: number, z: number} | ArrayLike<number>) {
    if (value['x'] != null) {
      if (this.cacheXYZ(value['x'], value['y'], value['z'])) {
        this.gl.uniform3f(this.location, value['x'], value['y'], value['z'])
      }
    } else {
      if (this.cacheXYZ(value[0], value[1], value[2])) {
        this.gl.uniform3f(this.location, value[0], value[1], value[2])
      }
    }
  }

  /**
   * Sets a four component float value. Commits it to the uniform variable of the program if it has changed.
   */
  public setVec4(value: {x: number, y: number, z: number, w: number} | ArrayLike<number>) {
    if (value['x'] != null) {
      if (this.cacheXYZW(value['x'], value['y'], value['z'], value['w'])) {
        this.gl.uniform4f(this.location, value['x'], value['y'], value['z'], value['w'])
      }
    } else {
      if (this.cacheXYZW(value[0], value[1], value[2], value[3])) {
        this.gl.uniform4f(this.location, value[0], value[1], value[2], value[3])
      }
    }
  }

  /**
   * Sets a float array value. Commits it to the uniform. Skips (and clears) the cache.
   */
  public setFloatArray(value: Float32List) {
    this.cachedValue.length = 0
    this.gl.uniform1fv(this.location, value)
  }

  /**
   * Sets a float array value. Commits it to the uniform. Skips (and clears) the cache.
   */
  public setFloat2Array(value: Float32List) {
    this.cachedValue.length = 0
    this.gl.uniform2fv(this.location, value)
  }

  /**
   * Sets a float array value. Commits it to the uniform. Skips (and clears) the cache.
   */
  public setFloat3Array(value: Float32List) {
    this.cachedValue.length = 0
    this.gl.uniform3fv(this.location, value)
  }

  /**
   * Sets a float array value. Commits it to the uniform. Skips (and clears) the cache.
   */
  public setFloat4Array(value: Float32List) {
    this.cachedValue.length = 0
    this.gl.uniform4fv(this.location, value)
  }

  /**
   * Sets a integer array value. Commits it to the uniform. Skips (and clears) the cache.
   */
  public setIntArray(value: Int32List) {
    this.cachedValue.length = 0
    this.gl.uniform1iv(this.location, value)
  }

  /**
   * Sets a integer array value. Commits it to the uniform. Skips (and clears) the cache.
   */
  public setInt2Array(value: Int32List) {
    this.cachedValue.length = 0
    this.gl.uniform2iv(this.location, value)
  }

  /**
   * Sets a Int array value. Commits it to the uniform. Skips (and clears) the cache.
   */
  public setInt3Array(value: Int32List) {
    this.cachedValue.length = 0
    this.gl.uniform3iv(this.location, value)
  }

  /**
   * Sets a Int array value. Commits it to the uniform. Skips (and clears) the cache.
   */
  public setInt4Array(value: Int32List) {
    this.cachedValue.length = 0
    this.gl.uniform4iv(this.location, value)
  }

  /**
   * Sets a 2x2 matrix value on the uniform. Skips (and clears) the cache.
   */
  public setMat2(value: { data: Float32List }, transpose: boolean) {
    this.cachedValue.length = 0
    this.gl.uniformMatrix2fv(this.location, !!transpose, value.data)
  }

  /**
   * Sets a 3x3 matrix value on the uniform. Skips (and clears) the cache.
   */
  public setMat3(value: { data: Float32List }, transpose: boolean) {
    this.cachedValue.length = 0
    this.gl.uniformMatrix3fv(this.location, !!transpose, value.data)
  }

  /**
   * Sets a 4x4 matrix value on the uniform. Skips (and clears) the cache.
   */
  public setMat4(value: { data: Float32List }, transpose: boolean) {
    this.cachedValue.length = 0
    this.gl.uniformMatrix4fv(this.location, !!transpose, value.data)
  }

  /**
   * Binds a texture to this uniform
   */
  public setTexture(value: Texture) {
    const device = this.device
    const unit = device.textureUnits[this.register] || device.textureUnits[0]
    this.setInt(unit.index)

    // perform the update
    // - for video textures this will update the playback state
    // - for image textures this will update the ready state
    if (value) {
      value.update()
    }
    // as long as a texture is not ready to render use a fallback texture instead
    if (!value || !value.ready) {
      value = this.device.defaultTexture
    }

    unit.texture = value
    unit.commit(this.filter)
  }
}
