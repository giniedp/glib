import { Log } from '@gglib/utils'

import { nameOfShaderType, valueOfShaderType } from '../../enums'
import { Shader, ShaderOptions } from '../../resources'
import { ShaderInspector } from '../../ShaderInspector'
import { DeviceGL } from '../DeviceGL'

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

  public handle: WebGLShader

  /**
   *
   */
  constructor(device: DeviceGL, options: ShaderOptions) {
    super()
    this.device = device
    this.source = options.source
    this.type = valueOfShaderType(options.type)
    this.typeName = nameOfShaderType(this.type)
    if (!this.typeName) {
      Log.warn('[Shader] unknown "type" option', options.type, this)
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
    if (!this.handle) {
      this.handle = this.device.context.createShader(this.type)
    }
    if (!this.source) {
      Log.error('[Shader] can not compile shader, source is missing', this)
      return this
    }
    const gl = this.device.context
    gl.shaderSource(this.handle, this.source)
    gl.compileShader(this.handle)
    this.compiled = gl.getShaderParameter(this.handle, gl.COMPILE_STATUS)
    this.info = gl.getShaderInfoLog(this.handle)

    if (!this.compiled) {
      Log.error('[Shader] compilation failed', ShaderInspector.formatInfoLog(this.info, this.source))
    }
    return this
  }

  public get debug() {
    const compiled = this.device.capabilities.extension('WEBGL_debug_shaders')?.getTranslatedShaderSource(this.handle)
    console.log(compiled)
    return compiled
  }
}
