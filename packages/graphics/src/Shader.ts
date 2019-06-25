import { Log, uuid } from '@gglib/utils'

import { Device } from './Device'
import { nameOfShaderType, ShaderType, ShaderTypeOption, valueOfShaderType } from './enums'
import { ShaderInspector } from './ShaderInspector'

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
export class Shader {

  public static readonly OptionsSymbol = Symbol('ShaderOptions')

  /**
   * A unique id
   */
  public readonly uid: string = uuid()
  /**
   * The graphics device
   */
  public readonly device: Device
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
   * The {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGLShader | WebGLShader} instance
   */
  public handle: WebGLShader
  /**
   * Whether compilation was successful
   */
  public compiled: boolean
  /**
   * The info log that is created after compilation holding error information
   */
  public info: string

  /**
   *
   */
  constructor(device: Device, options: ShaderOptions) {
    this.device = device

    this.source = options.source
    this.type = valueOfShaderType(options.type)
    this.typeName = nameOfShaderType(this.type)

    if (!this.typeName) {
      Log.w('[Shader] unknown "type" option', options.type, this)
    }

    this.handle = options.handle
    if (!this.handle || !this.device.context.isShader(this.handle)) {
      this.handle = this.device.context.createShader(this.type)
    }

    if (this.source) {
      this.compile()
    }
  }

  /**
   * Releases the shader handle
   */
  public destroy(): this {
    if (this.device.context.isShader(this.handle)) {
      this.device.context.deleteShader(this.handle)
      this.handle = null
    }
    return this
  }

  /**
   * Compiles the shader source code
   */
  public compile(): this {
    if (!this.source) {
      Log.e('[Shader] can not compile shader, source is missing', this)
      return this
    }
    const gl = this.device.context
    gl.shaderSource(this.handle, this.source)
    gl.compileShader(this.handle)
    this.compiled = gl.getShaderParameter(this.handle, gl.COMPILE_STATUS)
    this.info = gl.getShaderInfoLog(this.handle)

    if (!this.compiled) {
      Log.e('[Shader] compilation failed', ShaderInspector.formatInfoLog(this.info, this.source))
    }
    return this
  }

  /**
   * Creates a clone of this shader
   */
  public clone(): Shader {
    return new Shader(this.device, { type: this.type, source: this.source })
  }
}
