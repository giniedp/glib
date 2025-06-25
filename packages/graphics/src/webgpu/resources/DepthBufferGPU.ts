import { DepthBuffer, DepthBufferOptions } from '../../resources/DepthBuffer'
import { DeviceGPU } from '../DeviceGPU'

/**
 * Describes a depth buffer object
 *
 * @public
 */
export class DepthBufferGPU extends DepthBuffer {
  /**
   * The graphics device
   */
  public readonly device: DeviceGPU

  /**
   * The wrapped WebGLRenderbuffer object
   */
  public resource: GPUTexture

  private get depthFormatGPU() {
    switch (this.depthFormat) {
      case 'Depth32':
        return 'depth32float'
      case 'Depth32Stencil8':
      case 'Depth24Stencil8':
      case 'DepthStencil':
        return 'depth24plus-stencil8'
      default:
        return 'depth24plus'
    }
  }

  /**
   * Initializes a new instance
   * @param device - The graphics device
   * @param options - The setup options to initialize the instance
   */
  constructor(device: DeviceGPU, options: DepthBufferOptions) {
    super()
    this.device = device
    this.reset(options)
  }

  public create() {
    if (this.resource == null) {
      this.resource = this.device.device.createTexture({
        dimension: '2d',
        format: this.depthFormatGPU,
        mipLevelCount: 1,
        sampleCount: 1, // TODO:
        size: {
          width: this.width,
          height: this.height,
          depth: 1,
        },
        usage: GPUTextureUsage.OUTPUT_ATTACHMENT,
      })
    }
    return this
  }

  public destroy() {
    if (this.resource) {
      this.device.unregisterDepthBuffer(this)
      this.resource.destroy()
      this.resource = null
    }
    return this
  }
}
