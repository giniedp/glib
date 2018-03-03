import { Log, uuid } from '@gglib/core'

import { Device } from './Device'
import { ShaderType } from './enums'

/**
 * The shader constructor options
 */
export interface ShaderOptions {
  /**
   * The shader source code
   */
  source?: string,
  /**
   * The shader type e.g. VertexShader or Fragment shader
   */
  type?: string|number,
  /**
   * A WebGLShader object to be reused
   */
  handle?: WebGLShader
}

/**
 *
 */
export class Shader {
  /**
   * A unique id
   */
  public uid: string
  /**
   * The graphics device
   */
  public device: Device
  /**
   * The rendering context
   */
  public gl: WebGLRenderingContext
  /**
   * The shader source code
   */
  public source: string
  /**
   * The shader type (as a  WebGL constant)
   */
  public type: number
  /**
   * The shader type (as readable name)
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
  constructor(device: Device, params: ShaderOptions= {}) {
    this.uid = uuid()
    this.device = device
    this.gl = device.context

    this.source = params.source
    this.type = ShaderType[params.type]
    this.typeName = ShaderType.nameOf(this.type)

    if (!this.typeName) {
      Log.l(this, 'unknown shader type given', params.type)
    }

    this.handle = params.handle
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
   * Compiles the current shader source code
   */
  public compile(): Shader {
    if (!this.source) {
      Log.e('[Shader] Unable to compile shader, source is missing', this)
      return this
    }

    this.gl.shaderSource(this.handle, this.source)
    this.gl.compileShader(this.handle)
    this.compiled = this.gl.getShaderParameter(this.handle, this.gl.COMPILE_STATUS)
    this.info = this.gl.getShaderInfoLog(this.handle)

    if (!this.compiled) {
      Log.e('[Shader] compilation failed', this.info, this)
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
