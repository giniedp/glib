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
   */
  vertexShader?: string

  /**
   * The fragment shader to be used within the program
   */
  fragmentShader?: string
}

/**
 * A wrapper class around {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGLProgram | WebGLProgram}
 *
 * @public
 * @remarks
 * Combines a vertex shader and a fragment shader into a shader program.
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

  public abstract readonly whenReady: Promise<boolean>

  public abstract readonly isReady: boolean

  private errLogs = {}

  public abstract create(): this

  /**
   * Releases the program handle
   */
  public abstract dispose(): this

  /**
   * Sets this program as the current program on the graphics device
   */
  public bind(): this {
    return (this.device.program = this)
  }

  /**
   * Creates a new copy of this resource
   *
   * @remarks
   * The underlying implementation may use reference counting. In that case, the returned program
   * may be the same instance with an increased reference count.
   */
  public clone(): ShaderProgram {
    return this.device.createProgram({
      vertexShader: this.vertexShader?.source,
      fragmentShader: this.fragmentShader?.source,
    })
  }

  /**
   * Sets multiple uniform values.
   *
   * @remarks
   * Takes only known uniform names into account and ignores `null` values
   */
  public setUniforms(uniforms?: { [key: string]: ShaderUniformValue }): this {
    if (!uniforms) {
      return this
    }
    this.bind()
    for (const [key, uniform] of this.uniforms) {
      if (uniforms[key] != null) {
        uniform.set(uniforms[key])
      } else if (uniform.isTexture) {
        // If the uniform is a texture, we set it to null
        // to ensure it is not bound to any texture unit
        // this avoids the error: "Two textures of different types use the same sampler location"
        // which may happen when a texture was bound to the texture unit by preceding program
        // but for this program no value was set yet
        uniform.setTexture(null)
      }
    }
    return this
  }

  /**
   * Sets a value on the named uniform
   *
   * @remarks
   * `null` values are ignored for non-texture uniforms.
   */
  public setUniform(name: string, value: ShaderUniformValue): this {
    const uniform = this.uniforms.get(name)
    if (!uniform) {
      this.reportMissingUniform(name)
      return this
    }

    if (uniform.isTexture || value != null) {
      this.bind()
      uniform.set(value || null)
    }
    return this
  }

  /**
   * Sets the binding values to available uniforms.
   *
   * @param bindings
   */
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

  protected convertShaderSource(type: ShaderType, source: string | ShaderOptions | Shader): Shader {
    if (source instanceof Shader) {
      return source
    }
    if (typeof source === 'string') {
      return this.device.createShader({
        type: type,
        source: source,
      })
    }
    return this.device.createShader(source)
  }
}
