import { Log, uuid } from '@gglib/core'

import { Device } from './Device'
import { nameOfShaderType, ShaderType, ShaderTypeOption, valueOfShaderType } from './enums'
import { ShaderInspector } from './ShaderInspector'

/**
 * The shader constructor options
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
  type?: ShaderTypeOption,
  /**
   * A WebGLShader object to be reused
   */
  handle?: WebGLShader
}

/**
 * Represents the source code of a `VertexShader` or a `FragmentShader`
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
   * The rendering context
   */
  public readonly gl: WebGLRenderingContext
  /**
   * The shader source code
   */
  public source: string
  /**
   * The shader type (as a  WebGL constant)
   */
  public type: ShaderType
  /**
   * The shader type (as readable name e.g. VertexShader or FragmentShader)
   */
  public typeName: string
  /**
   * The web gl shader instance
   */
  public handle: WebGLShader
  /**
   * Whether compilation was successfull
   */
  public compiled: boolean
  /**
   * The info log that is created after compilation holding error information
   */
  public info: string

  /**
   *
   */
  constructor(device: Device, options: ShaderOptions= {}) {
    this.device = device
    this.gl = device.context

    this.source = options.source
    this.type = valueOfShaderType(options.type)
    this.typeName = nameOfShaderType(this.type)

    if (!this.typeName) {
      Log.w('[Shader] unknown "type" option', options.type, this)
    }

    this.handle = options.handle
    if (!this.handle || !this.gl.isShader(this.handle)) {
      this.handle = this.gl.createShader(this.type)
    }

    if (this.source) {
      this.compile()
    }
  }

  /**
   * Releases the shader handle
   */
  public destroy(): Shader {
    if (this.gl.isShader(this.handle)) {
      this.gl.deleteShader(this.handle)
      this.handle = null
    }
    return this
  }

  /**
   * Compiles the shader source code
   */
  public compile(): Shader {
    if (!this.source) {
      Log.e('[Shader] can not compile shader, source is missing', this)
      return this
    }

    this.gl.shaderSource(this.handle, this.source)
    this.gl.compileShader(this.handle)
    this.compiled = this.gl.getShaderParameter(this.handle, this.gl.COMPILE_STATUS)
    this.info = this.gl.getShaderInfoLog(this.handle)

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
