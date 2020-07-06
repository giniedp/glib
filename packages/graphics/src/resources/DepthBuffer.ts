import { Device } from '../Device'
import { DepthFormat, DepthFormatOption, nameOfDepthFormat, valueOfDepthFormat } from '../enums'

/**
 * Options to be used to create a new DepthBuffer
 *
 * @public
 */
export interface DepthBufferOptions {
  /**
   * The width of the depth buffer surface
   */
  width: number
  /**
   * The height of the depth buffer surface
   */
  height: number
  /**
   * The depth and stencil format
   */
  depthFormat?: DepthFormatOption
  /**
   * The existing
   */
  handle?: WebGLRenderbuffer
}

/**
 * Describes a depth buffer object
 *
 * @public
 */
export abstract class DepthBuffer {
  /**
   * The graphics device
   */
  public abstract readonly device: Device
  /**
   * The width of the surface in pixels
   */
  public width: number
  /**
   * The height of the surface in pixels
   */
  public height: number
  /**
   * The used surface format
   */
  public depthFormat: number

  /**
   * Returns the WebGl constant name of the currently used depth format
   */
  get depthFormatName(): string {
    return nameOfDepthFormat(this.depthFormat)
  }

  /**
   * Re-initializes the instance
   * @param options - The setup options to initialize the instance
   */
  public init(options: DepthBufferOptions): DepthBuffer {
    let width = options.width
    let height = options.height
    let format = valueOfDepthFormat(options.depthFormat) || this.depthFormat || DepthFormat.DepthStencil

    if (width == null) {
      width = this.width
    }
    if (height == null) {
      height = this.height
    }

    if (width == null) {
      throw new Error('missing width option')
    }
    if (height == null) {
      throw new Error('missing height option')
    }

    if (this.width !== width || this.height !== height || this.depthFormat !== format) {
      this.destroy()
    }

    this.width = width
    this.height = height
    this.depthFormat = format

    this.create()

    return this
  }

  /**
   * Creates the graphics resource
   */
  public abstract create(): this

  /**
   * Deletes the wrapped WebGLRenderbuffer
   */
  public abstract destroy(): this
}
