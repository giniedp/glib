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
  public handle: WebGLRenderbuffer

  /**
   * Initializes a new instance
   * @param device - The graphics device
   * @param options - The setup options to initialize the instance
   */
  constructor(device: DeviceGL, options: DepthBufferOptions) {
    super()
    this.device = device
    this.init(options)
  }

  public create() {
    if (this.handle == null || this.device.context.isRenderbuffer(this.handle)) {
      const gl = this.device.context
      this.handle = gl.createRenderbuffer()
      gl.bindRenderbuffer(gl.RENDERBUFFER, this.handle)
      gl.renderbufferStorage(gl.RENDERBUFFER, this.depthFormat, this.width, this.height)
      gl.bindRenderbuffer(gl.RENDERBUFFER, null)
    }
    return this
  }

  public destroy() {
    this.device.unregisterDepthBuffer(this)
    if (this.device.context.isRenderbuffer(this.handle)) {
      this.device.context.deleteRenderbuffer(this.handle)
      this.handle = null
    }
    return this
  }
}
