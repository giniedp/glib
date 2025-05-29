import { Device } from '../Device'
import { DepthBuffer } from './DepthBuffer'
import { TextureImage } from './TextureImage'

/**
 * @public
 */
export interface FrameBufferOptions {
  /**
   *
   */
  textures?: TextureImage[]
  /**
   *
   */
  depthBuffer?: DepthBuffer

  resource?: unknown
}

/**
 * @public
 */
export abstract class FrameBuffer {
  public abstract readonly device: Device
  /**
   * Resets the framebuffer to the given options
   */
  public abstract reset(options: FrameBufferOptions): this
}
