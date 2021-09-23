// tslint:disable:no-bitwise

import { copy } from '@gglib/utils'

import { ShaderUniform, ShaderUniformOptions } from '../../resources/ShaderUniform'
import { SamplerState } from '../../states'
import { DeviceGL } from '../DeviceGL'
import type { ShaderProgramGL } from './ShaderProgramGL'

function parseArray(value: string) {
  let result: any = value.replace(/[\[\]]/g, '').split(',')
  for (let i = 0; i < result.length; i += 1) {
    result[i] = Number(result[i]) || 0
  }
  return result
}

function makeVec2(data: number[]) {
  return { x: data[0] || 0, y: data[1] || 0 }
}

function makeVec3(data: number[]) {
  return { x: data[0] || 0, y: data[1] || 0, z: data[2] || 0 }
}

function makeVec4(data: number[]) {
  return { x: data[0] || 0, y: data[1] || 0, z: data[2] || 0, w: data[3] || 0 }
}

/**
 * @public
 */
export class ShaderUniformGL extends ShaderUniform {
  /**
   * The graphics device
   */
  public readonly device: DeviceGL

  /**
   * The shader program
   */
  public readonly program: ShaderProgramGL

  /**
   * The WebGL Uniform location
   */
  public readonly location: WebGLUniformLocation
  /**
   * Meta data and annotations of this uniform
   */
  public readonly meta: Record<string, any>
  /**
   * The binding name of this uniform
   */
  public readonly name: string
  /**
   * The type name of the uniform in the shader
   */
  public readonly type: string
  /**
   * The default value
   */
  public readonly defaultValue: unknown
  /**
   * The size of the array, if this uniform is an array of simple type
   */
  public readonly size: number

  private gl: WebGLRenderingContext

  /**
   * Instantiates the {@link ShaderUniform}
   */
  constructor(program: ShaderProgramGL, options: ShaderUniformOptions & { size: number }) {
    super()
    this.device = program.device
    this.gl = this.device.context

    this.program = program
    this.meta = options
    this.name = options.binding || options.name
    this.type = options.type
    this.size = options.size

    this.location = this.device.context.getUniformLocation(program.handle, options.name)
    if (this.location == null) {
      this.set = () => {}
      return
    }

    const value = options.default

    // 'bvec2',
    // 'bvec3',
    // 'bvec4',

    // 'ivec2',
    // 'ivec3',
    // 'ivec4',

    // 'uvec2',
    // 'uvec3',
    // 'uvec4',

    switch (this.type) {
      case 'int':
      case 'uint':
      case 'long':
      case 'short':
        this.defaultValue = Number(value) || 0
        this.set = this.setInt
        break
      case 'bool':
        this.defaultValue = value === 'true' || value === '1' || value === 1
        this.set = this.setBool
        break
      case 'float':
      case 'double':
      case 'half':
        this.defaultValue = Number(value) || 0
        this.set = this.setFloat
        break
      case 'vec2':
      case 'hvec2':
      case 'fvec2':
      case 'dvec2':
        this.defaultValue = makeVec2(parseArray(value || ''))
        this.set = this.setVec2
        break
      case 'vec3':
      case 'hvec3':
      case 'fvec3':
      case 'dvec3':
        this.defaultValue = makeVec3(parseArray(value || ''))
        this.set = this.setVec3
        break
      case 'vec4':
      case 'hvec4':
      case 'fvec4':
      case 'dvec4':
        this.defaultValue = makeVec4(parseArray(value || ''))
        this.set = this.setVec4
        break

      case 'mat2':
      case 'mat2x2':
        this.set = this.setMat2
        break
      case 'mat2x3':
        this.set = this.setMat2x3
        break
      case 'mat2x4':
        this.set = this.setMat2x4
        break
      case 'mat3':
      case 'mat3x3':
        this.set = this.setMat3
        break
      case 'mat3x4':
        this.set = this.setMat3x4
        break
      case 'mat3x2':
        this.set = this.setMat3x2
        break
      case 'mat4':
      case 'mat4x4':
        this.set = this.setMat4
        break
      case 'mat4x3':
        this.set = this.setMat4x3
        break
      case 'mat4x2':
        this.set = this.setMat4x2
        break
      case 'texture':
      case 'texture2D':
      case 'textureCube':
      case 'sampler':
      case 'sampler2D':
      case 'samplerCube':
        if (this.meta.register) {
          this.register = Number(this.meta.register) | 0
        }
        this.filter = copy(SamplerState[this.meta.filter] || SamplerState.Default)
        this.set = this.setTexture
        break
      default:
        this.set = () => {
          /* */
        }
        break
    }
  }

  /**
   * Sets an int value. Commits it to the uniform variable of the program if it has changed.
   */
  public setInt(value: number) {
    if (this.state.write(value | 0)) {
      this.gl.uniform1i(this.location, value | 0)
    }
  }

  /**
   * Sets an int2 value. Commits it to the uniform variable of the program if it has changed.
   */
  public setInt2(v1: number, v2: number) {
    if (this.state.write2(v1 | 0, v2 | 0)) {
      this.gl.uniform2i(this.location, v1 | 0, v2 | 0)
    }
  }

  /**
   * Sets an int3 value. Commits it to the uniform variable of the program if it has changed.
   */
  public setInt3(v1: number, v2: number, v3: number) {
    if (this.state.write3(v1 | 0, v2 | 0, v3 | 0)) {
      this.gl.uniform3i(this.location, v1 | 0, v2 | 0, v3 | 0)
    }
  }

  /**
   * Sets an int4 value. Commits it to the uniform variable of the program if it has changed.
   */
  public setInt4(v1: number, v2: number, v3: number, v4: number) {
    if (this.state.write4(v1 | 0, v2 | 0, v3 | 0, v4 | 0)) {
      this.gl.uniform4i(this.location, v1 | 0, v2 | 0, v3 | 0, v4 | 0)
    }
  }

  /**
   * Sets a boolean value. Commits it to the uniform variable of the program if it has changed.
   */
  public setBool(value: boolean) {
    if (this.state.write(value)) {
      this.gl.uniform1i(this.location, value ? 1 : 0)
    }
  }

  /**
   * Sets a boolean2 value. Commits it to the uniform variable of the program if it has changed.
   */
  public setBool2(v1: boolean, v2: boolean) {
    if (this.state.write2(v1, v2)) {
      this.gl.uniform2i(this.location, v1 ? 1 : 0, v2 ? 1 : 0)
    }
  }

  /**
   * Sets a boolean3 value. Commits it to the uniform variable of the program if it has changed.
   */
  public setBool3(v1: boolean, v2: boolean, v3: boolean) {
    if (this.state.write3(v1, v2, v3)) {
      this.gl.uniform3i(this.location, v1 ? 1 : 0, v2 ? 1 : 0, v3 ? 1 : 0)
    }
  }

  /**
   * Sets a boolean4 value. Commits it to the uniform variable of the program if it has changed.
   */
  public setBool4(v1: boolean, v2: boolean, v3: boolean, v4: boolean) {
    if (this.state.write4(v1, v2, v3, v4)) {
      this.gl.uniform4i(this.location, v1 ? 1 : 0, v2 ? 1 : 0, v3 ? 1 : 0, v4 ? 1 : 0)
    }
  }

  /**
   * Sets a float value. Commits it to the uniform variable of the program if it has changed.
   */
  public setFloat(value: number) {
    if (this.state.write(value)) {
      this.gl.uniform1f(this.location, value)
    }
  }

  /**
   * Sets a two component float value. Commits it to the uniform variable of the program if it has changed.
   */
  public setFloat2(v1: number, v2: number) {
    if (this.state.write2(v1, v2)) {
      this.gl.uniform2f(this.location, v1, v2)
    }
  }

  /**
   * Sets a three component float value. Commits it to the uniform variable of the program if it has changed.
   */
  public setFloat3(v1: number, v2: number, v3: number) {
    if (this.state.write3(v1, v2, v3)) {
      this.gl.uniform3f(this.location, v1, v2, v3)
    }
  }

  /**
   * Sets a four component float value. Commits it to the uniform variable of the program if it has changed.
   */
  public setFloat4(v1: number, v2: number, v3: number, v4: number) {
    if (this.state.write4(v1, v2, v3, v4)) {
      this.gl.uniform4f(this.location, v1, v2, v3, v4)
    }
  }

  /**
   * Sets a two component float value. Commits it to the uniform variable of the program if it has changed.
   */
  public setVec2(value: { x: number; y: number } | ArrayLike<number>) {
    if (value['x'] != null) {
      if (this.state.write2(value['x'], value['y'])) {
        this.gl.uniform2f(this.location, value['x'], value['y'])
      }
    } else {
      if (this.state.write2(value[0], value[1])) {
        this.gl.uniform2f(this.location, value[0], value[1])
      }
    }
  }

  /**
   * Sets a three component float value. Commits it to the uniform variable of the program if it has changed.
   */
  public setVec3(value: { x: number; y: number; z: number } | ArrayLike<number>) {
    if (value['x'] != null) {
      if (this.state.write3(value['x'], value['y'], value['z'])) {
        this.gl.uniform3f(this.location, value['x'], value['y'], value['z'])
      }
    } else {
      if (this.state.write3(value[0], value[1], value[2])) {
        this.gl.uniform3f(this.location, value[0], value[1], value[2])
      }
    }
  }

  /**
   * Sets a four component float value. Commits it to the uniform variable of the program if it has changed.
   */
  public setVec4(value: { x: number; y: number; z: number; w: number } | ArrayLike<number>) {
    if (value['x'] != null) {
      if (this.state.write4(value['x'], value['y'], value['z'], value['w'])) {
        this.gl.uniform4f(this.location, value['x'], value['y'], value['z'], value['w'])
      }
    } else {
      if (this.state.write4(value[0], value[1], value[2], value[3])) {
        this.gl.uniform4f(this.location, value[0], value[1], value[2], value[3])
      }
    }
  }

  /**
   * Sets a float array value. Commits it to the uniform. Skips (and clears) the cache.
   */
  public setFloatArray(value: Float32List) {
    this.state.clear()
    this.gl.uniform1fv(this.location, value)
  }

  /**
   * Sets a float array value. Commits it to the uniform. Skips (and clears) the cache.
   */
  public setFloat2Array(value: Float32List) {
    this.state.clear()
    this.gl.uniform2fv(this.location, value)
  }

  /**
   * Sets a float array value. Commits it to the uniform. Skips (and clears) the cache.
   */
  public setFloat3Array(value: Float32List) {
    this.state.clear()
    this.gl.uniform3fv(this.location, value)
  }

  /**
   * Sets a float array value. Commits it to the uniform. Skips (and clears) the cache.
   */
  public setFloat4Array(value: Float32List) {
    this.state.clear()
    this.gl.uniform4fv(this.location, value)
  }

  /**
   * Sets a integer array value. Commits it to the uniform. Skips (and clears) the cache.
   */
  public setIntArray(value: Int32List) {
    this.state.clear()
    this.gl.uniform1iv(this.location, value)
  }

  /**
   * Sets a integer array value. Commits it to the uniform. Skips (and clears) the cache.
   */
  public setInt2Array(value: Int32List) {
    this.state.clear()
    this.gl.uniform2iv(this.location, value)
  }

  /**
   * Sets a Int array value. Commits it to the uniform. Skips (and clears) the cache.
   */
  public setInt3Array(value: Int32List) {
    this.state.clear()
    this.gl.uniform3iv(this.location, value)
  }

  /**
   * Sets a Int array value. Commits it to the uniform. Skips (and clears) the cache.
   */
  public setInt4Array(value: Int32List) {
    this.state.clear()
    this.gl.uniform4iv(this.location, value)
  }

  /**
   * Sets a 2x2 matrix value on the uniform. Skips (and clears) the cache.
   */
  public setMat2(value: { m: Float32List }, transpose: boolean) {
    this.state.clear()
    this.gl.uniformMatrix2fv(this.location, !!transpose, value.m)
  }

  /**
   * Sets a 2x3 matrix value on the uniform. Skips (and clears) the cache.
   */
  public setMat2x3(value: { m: Float32List }, transpose: boolean, srcOffset?: number, srcLength?: number) {
    this.state.clear()
    const gl = this.gl as WebGL2RenderingContext
    gl.uniformMatrix2x3fv(this.location, !!transpose, value.m, srcOffset, srcLength)
  }

  /**
   * Sets a 2x3 matrix value on the uniform. Skips (and clears) the cache.
   */
  public setMat2x4(value: { m: Float32List }, transpose: boolean, srcOffset?: number, srcLength?: number) {
    this.state.clear()
    const gl = this.gl as WebGL2RenderingContext
    gl.uniformMatrix2x4fv(this.location, !!transpose, value.m, srcOffset, srcLength)
  }

  /**
   * Sets a 3x3 matrix value on the uniform. Skips (and clears) the cache.
   */
  public setMat3(value: { m: Float32List }, transpose: boolean) {
    this.state.clear()
    this.gl.uniformMatrix3fv(this.location, !!transpose, value.m)
  }

  /**
   * Sets a 3x4 matrix value on the uniform. Skips (and clears) the cache.
   */
  public setMat3x4(value: { m: Float32List }, transpose: boolean, srcOffset?: number, srcLength?: number) {
    this.state.clear()
    const gl = this.gl as WebGL2RenderingContext
    gl.uniformMatrix3x4fv(this.location, !!transpose, value.m, srcOffset, srcLength)
  }

  /**
   * Sets a 3x2 matrix value on the uniform. Skips (and clears) the cache.
   */
  public setMat3x2(value: { m: Float32List }, transpose: boolean, srcOffset?: number, srcLength?: number) {
    this.state.clear()
    const gl = this.gl as WebGL2RenderingContext
    gl.uniformMatrix3x2fv(this.location, !!transpose, value.m, srcOffset, srcLength)
  }

  /**
   * Sets a 4x4 matrix value on the uniform. Skips (and clears) the cache.
   */
  public setMat4(value: { m: Float32List }, transpose: boolean) {
    this.state.clear()
    this.gl.uniformMatrix4fv(this.location, !!transpose, value.m)
  }

  /**
   * Sets a 4x3 matrix value on the uniform. Skips (and clears) the cache.
   */
  public setMat4x3(value: { m: Float32List }, transpose: boolean, srcOffset?: number, srcLength?: number) {
    this.state.clear()
    const gl = this.gl as WebGL2RenderingContext
    gl.uniformMatrix4x3fv(this.location, !!transpose, value.m, srcOffset, srcLength)
  }

  /**
   * Sets a 4x2 matrix value on the uniform. Skips (and clears) the cache.
   */
  public setMat4x2(value: { m: Float32List }, transpose: boolean, srcOffset?: number, srcLength?: number) {
    this.state.clear()
    const gl = this.gl as WebGL2RenderingContext
    gl.uniformMatrix4x2fv(this.location, !!transpose, value.m, srcOffset, srcLength)
  }
}
