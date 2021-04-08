// tslint:disable:no-bitwise

import { IMat, IVec2, IVec3, IVec4 } from '@gglib/math'
import { copy } from '@gglib/utils'
import { Device } from '../Device'
import { ShaderProgram, Texture } from '../resources'
import { SamplerState, SamplerStateParams } from '../states'

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
   * ```c
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
   * ```c
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
   * ```c
   * // @register 2
   * uniform sampler2d uTexture;
   * ```
   */
  register?: number
}

/**
 * @public
 */
export abstract class ShaderUniform {
  /**
   * The graphics device
   */
  public abstract readonly device: Device
  /**
   * The rendering context
   */
  // public gl: WebGLRenderingContext
  /**
   * The shader program
   */
  public abstract readonly program: ShaderProgram
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

  protected cacheX(x: number | boolean): boolean {
    let changed = false
    let cache = this.cachedValue
    if (cache[0] !== x) {
      cache[0] = x
      changed = true
    }
    cache.length = 1
    return changed
  }

  protected cacheXY(x: number | boolean, y: number | boolean): boolean {
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

  protected cacheXYZ(x: number | boolean, y: number | boolean, z: number | boolean): boolean {
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

  protected cacheXYZW(x: number | boolean, y: number | boolean, z: number | boolean, w: number | boolean): boolean {
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
  public abstract setInt(value: number): void

  /**
   * Sets an int2 value. Commits it to the uniform variable of the program if it has changed.
   */
  public abstract setInt2(v1: number, v2: number): void

  /**
   * Sets an int3 value. Commits it to the uniform variable of the program if it has changed.
   */
  public abstract setInt3(v1: number, v2: number, v3: number): void

  /**
   * Sets an int4 value. Commits it to the uniform variable of the program if it has changed.
   */
  public abstract setInt4(v1: number, v2: number, v3: number, v4: number): void

  /**
   * Sets a boolean value. Commits it to the uniform variable of the program if it has changed.
   */
  public abstract setBool(value: boolean): void

  /**
   * Sets a boolean2 value. Commits it to the uniform variable of the program if it has changed.
   */
  public abstract setBool2(v1: boolean, v2: boolean): void

  /**
   * Sets a boolean3 value. Commits it to the uniform variable of the program if it has changed.
   */
  public abstract setBool3(v1: boolean, v2: boolean, v3: boolean): void

  /**
   * Sets a boolean4 value. Commits it to the uniform variable of the program if it has changed.
   */
  public abstract setBool4(v1: boolean, v2: boolean, v3: boolean, v4: boolean): void

  /**
   * Sets a float value. Commits it to the uniform variable of the program if it has changed.
   */
  public abstract setFloat(value: number): void

  /**
   * Sets a two component float value. Commits it to the uniform variable of the program if it has changed.
   */
  public abstract setFloat2(v1: number, v2: number): void

  /**
   * Sets a three component float value. Commits it to the uniform variable of the program if it has changed.
   */
  public abstract setFloat3(v1: number, v2: number, v3: number): void

  /**
   * Sets a four component float value. Commits it to the uniform variable of the program if it has changed.
   */
  public abstract setFloat4(v1: number, v2: number, v3: number, v4: number): void

  /**
   * Sets a two component float value. Commits it to the uniform variable of the program if it has changed.
   */
  public abstract setVec2(value: {x: number, y: number} | ArrayLike<number>): void

  /**
   * Sets a three component float value. Commits it to the uniform variable of the program if it has changed.
   */
  public abstract setVec3(value: {x: number, y: number, z: number} | ArrayLike<number>): void

  /**
   * Sets a four component float value. Commits it to the uniform variable of the program if it has changed.
   */
  public abstract setVec4(value: {x: number, y: number, z: number, w: number} | ArrayLike<number>): void

  /**
   * Sets a float array value. Commits it to the uniform. Skips (and clears) the cache.
   */
  public abstract setFloatArray(value: Float32List): void

  /**
   * Sets a float array value. Commits it to the uniform. Skips (and clears) the cache.
   */
  public abstract setFloat2Array(value: Float32List): void

  /**
   * Sets a float array value. Commits it to the uniform. Skips (and clears) the cache.
   */
  public abstract setFloat3Array(value: Float32List): void

  /**
   * Sets a float array value. Commits it to the uniform. Skips (and clears) the cache.
   */
  public abstract setFloat4Array(value: Float32List): void

  /**
   * Sets a integer array value. Commits it to the uniform. Skips (and clears) the cache.
   */
  public abstract setIntArray(value: Int32List): void

  /**
   * Sets a integer array value. Commits it to the uniform. Skips (and clears) the cache.
   */
  public abstract setInt2Array(value: Int32List): void

  /**
   * Sets a Int array value. Commits it to the uniform. Skips (and clears) the cache.
   */
  public abstract setInt3Array(value: Int32List): void

  /**
   * Sets a Int array value. Commits it to the uniform. Skips (and clears) the cache.
   */
  public abstract setInt4Array(value: Int32List): void

  /**
   * Sets a 2x2 matrix value on the uniform. Skips (and clears) the cache.
   */
  public abstract setMat2(value: { m: Float32List }, transpose: boolean): void

  /**
   * Sets a 3x3 matrix value on the uniform. Skips (and clears) the cache.
   */
  public abstract setMat3(value: { m: Float32List }, transpose: boolean): void

  /**
   * Sets a 4x4 matrix value on the uniform. Skips (and clears) the cache.
   */
  public abstract setMat4(value: { m: Float32List }, transpose: boolean): void

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
