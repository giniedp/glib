import { Log, uuid } from '@gglib/utils'

import { Device } from '../Device'
import { nameOfShaderType, ShaderType, ShaderTypeOption, valueOfShaderType } from '../enums'

/**
 * Constructor options for {@link Shader}
 *
 * @public
 */
export interface ShaderOptions {
  /**
   * The shader source code
   */
  source?: string,
  /**
   * The shader type e.g. VertexShader or Fragment shader
   */
  type: ShaderTypeOption,
  /**
   * A {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGLShader | WebGLShader} object to be reused
   */
  handle?: WebGLShader
}

/**
 * A wrapper class around the {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGLShader | WebGLShader}
 *
 * @public
 */
export abstract class Shader {

  public static readonly OptionsSymbol = Symbol('ShaderOptions')

  /**
   * A unique id
   */
  public readonly uid: string = uuid()
  /**
   * The graphics device
   */
  public abstract readonly device: Device
  /**
   * The shader source code
   */
  public source: string
  /**
   * The shader type as a  WebGL constant
   */
  public type: ShaderType
  /**
   * The shader type as readable name e.g. VertexShader or FragmentShader
   */
  public typeName: string
  /**
   * Whether compilation was successful
   */
  public compiled: boolean

  /**
   * Releases the shader handle
   */
  public abstract destroy(): this

  /**
   * Compiles the shader source code
   */
  public abstract compile(): this

  /**
   * Creates a clone of this shader
   */
  public clone(): Shader {
    return this.device.createShader({
      type: this.type,
      source: this.source,
    })
  }
}
