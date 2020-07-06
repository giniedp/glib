import { Device } from '../Device'
import { DepthBuffer } from './DepthBuffer'
import { Texture } from './Texture'

/**
 * @public
 */
export interface FrameBufferOptions {
  /**
   *
   */
  textures?: Texture[],
  /**
   *
   */
  depthBuffer?: DepthBuffer,
}

/**
 * @public
 */
export abstract class FrameBuffer {
  public abstract readonly device: Device
  public abstract init(options: FrameBufferOptions): this
}
