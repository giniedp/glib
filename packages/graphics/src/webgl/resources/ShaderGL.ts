import { Log } from '@gglib/utils'

import { shaderTypeToWebGL } from '../../enums'
import { Shader, ShaderOptions } from '../../resources'
import { DeviceGL } from '../DeviceGL'
import { Glsl } from '../glsl'

/**
 * A wrapper class around the {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGLShader | WebGLShader}
 *
 * @public
 */
export class ShaderGL extends Shader {
  /**
   * The graphics device
   */
  public readonly device: DeviceGL

  /**
   * The info log that is created after compilation holding error information
   */
  public info: string

  /**
   * The native WebGL shader resource
   */
  public resource: WebGLShader

  private glType: GLenum
  /**
   *
   */
  constructor(device: DeviceGL, options: ShaderOptions) {
    super()
    this.device = device
    this.source = options.source
    this.type = options.type
    this.glType = shaderTypeToWebGL(this.type)
    if (!this.glType) {
      Log.warn('[Shader] unknown "type" option', options.type, this)
    }
    if (this.source) {
      this.compile()
    }
  }

  /**
   * Releases the shader handle
   */
  public dispose(): this {
    if (this.device.context.isShader(this.resource)) {
      this.device.context.deleteShader(this.resource)
      this.resource = null
    }
    return this
  }

  /**
   * Compiles the shader source code
   */
  public compile(): this {
    if (!this.resource) {
      this.resource = this.device.context.createShader(this.glType)
    }
    if (!this.source) {
      Log.error('[Shader] can not compile shader, source is missing', this)
      return this
    }
    const gl = this.device.context
    gl.shaderSource(this.resource, this.source)
    gl.compileShader(this.resource)
    // don't check compile status immediately
    // this will be done by the program when linking fails
    return this
  }

  public status() {
    const gl = this.device.context
    this.compiled = gl.getShaderParameter(this.resource, gl.COMPILE_STATUS)
    this.info = gl.getShaderInfoLog(this.resource)

    if (!this.compiled) {
      Log.error('[Shader] compilation failed', Glsl.formatError(this.info, this.source))
    }
  }

  public get debug() {
    const compiled = this.device.capabilities.extension('WEBGL_debug_shaders')?.getTranslatedShaderSource(this.resource)
    console.log(compiled)
    return compiled
  }
}
