import { depthFormatToWebGL } from '../../enums'
import { DepthBuffer, DepthBufferOptions } from '../../resources/DepthBuffer'
import { DeviceGL } from '../DeviceGL'

/**
 * Describes a depth buffer object
 *
 * @public
 */
export class DepthBufferGL extends DepthBuffer {
  /**
   * The graphics device
   */
  public readonly device: DeviceGL

  /**
   * The wrapped WebGLRenderbuffer object
   */
  public resource: WebGLRenderbuffer

  private glFormat: GLenum

  /**
   * Initializes a new instance
   * @param device - The graphics device
   * @param options - The setup options to initialize the instance
   */
  constructor(device: DeviceGL, options: DepthBufferOptions) {
    super()
    this.device = device
    this.reset(options)
  }

  public create() {
    if (this.resource == null || this.device.context.isRenderbuffer(this.resource)) {
      const gl = this.device.context
      this.resource = gl.createRenderbuffer()
      this.glFormat = depthFormatToWebGL(this.depthFormat)
      gl.bindRenderbuffer(gl.RENDERBUFFER, this.resource)
      gl.renderbufferStorage(gl.RENDERBUFFER, this.glFormat, this.width, this.height)
      gl.bindRenderbuffer(gl.RENDERBUFFER, null)
    }
    return this
  }

  public destroy() {
    this.device.unregisterDepthBuffer(this)
    if (this.device.context.isRenderbuffer(this.resource)) {
      this.device.context.deleteRenderbuffer(this.resource)
      this.resource = null
    }
    return this
  }
}
