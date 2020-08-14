import { Log, uuid } from '@gglib/utils'
import { Device } from '../Device'
import { ShaderType } from '../enums'
import { Shader, ShaderOptions } from './Shader'
import { ShaderUniform, ShaderUniformBinding, ShaderUniformValue } from './ShaderUniform'

/**
 * Constructor options for {@link ShaderProgram}
 *
 * @public
 */
export interface ShaderProgramOptions {
  /**
   * The vertex shader to be used within the program
   *
   * @remarks
   * If it is a string it is assumed to be the source code for the vertex shader.
   * If it is an object it is assumed to be the shader options to be passed into the `Shader` constructor.
   */
  vertexShader?: string|ShaderOptions|Shader,
  /**
   * The fragment shader to be used within the program
   *
   * @remarks
   * If it is a string it is assumed to be the source code for the fragment shader.
   * If it is an object it is assumed to be the shader options to be passed into the `Shader` constructor.
   */
  fragmentShader?: string|ShaderOptions|Shader,
}

/**
 * A wrapper class around {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGLProgram | WebGLProgram}
 *
 * @public
 * @remarks
 * Combines a vertex shader and a fragment shader into a shader program.
 *
 * On creation the shader source code is inspected for
 */
export abstract class ShaderProgram {
  /**
   * A symbol identifying the `ShaderProgramOptions` type.
   */
  public static readonly OptionsSymbol = Symbol('ShaderProgramOptions')
  /**
   * A unique id
   */
  public readonly uid: string = uuid()
  /**
   * The graphics device
   */
  public abstract readonly device: Device
  /**
   * The vertex shader
   */
  public abstract readonly vertexShader: Shader
  /**
   * The fragment shader
   */
  public abstract readonly fragmentShader: Shader
  /**
   * A map of all shader uniforms
   */
  public readonly uniforms: ReadonlyMap<string, ShaderUniform> = new Map<string, ShaderUniform>()

  private errLogs = {}

  public abstract create(): this

  /**
   * Releases the program handle
   */
  public abstract destroy(): this

  /**
   * Sets this program as the current program on the graphics device
   */
  public bind(): this {
    return this.device.program = this
  }

  /**
   * Creates a new copy of this resource
   */
  public clone(): ShaderProgram {
    return this.device.createProgram({
      vertexShader: this.vertexShader ? this.vertexShader.clone() : void 0,
      fragmentShader: this.fragmentShader ? this.fragmentShader.clone() : void 0,
    })
  }

  /**
   * Sets multiple uniform values.
   *
   * @remarks
   * Takes only known uniform names into account and ignores `null` values
   */
  public setUniforms(uniforms?: { [key: string]: ShaderUniformValue }): this {
    if (!uniforms) { return this }
    this.bind()
    this.uniforms.forEach((uniform, key) => {
      if (uniforms[key] != null) {
        uniform.set(uniforms[key])
      }
    })
    // for (const key in this.uniforms.keys()) {
    //   if (uniforms[key] != null) {
    //     this.uniforms.get(key).set(uniforms[key])
    //   }
    // }
    return this
  }

  /**
   * Sets a value on the named uniform
   *
   * @remarks
   * `null` values are ignored
   */
  public setUniform(name: string, value: ShaderUniformValue): this {
    if (value == null) { return }
    const uniform = this.uniforms.get(name)
    if (!uniform) {
      this.reportMissingUniform(name)
    } else {
      this.bind()
      uniform.set(value)
    }
    return this
  }

  public applyBindings(bindings: ShaderUniformBinding[]) {
    let binding: ShaderUniformBinding
    let uniform: ShaderUniform
    for (let i = 0; i < bindings.length; i++) {
      binding = bindings[i]
      uniform = this.uniforms.get(binding.name)
      if (uniform && uniform.type === binding.type) {
        uniform.set(binding.value)
      }
    }
  }

  private reportMissingUniform(name: string) {
    if (!this.errLogs[name]) {
      Log.warn(`Uniform '${name}' not found`, this)
      this.errLogs[name] = true
    }
  }

  protected getShader(type: ShaderType, from: string | ShaderOptions | Shader): Shader {
    if (from instanceof Shader) {
      return from
    }
    if (typeof from === 'string') {
      return this.device.createShader({
        type: type,
        source: from,
      })
    }
    return this.device.createShader(from)
  }
}
