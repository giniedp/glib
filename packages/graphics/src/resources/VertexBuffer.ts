import { Device } from '../Device'
import { Buffer, BufferOptions } from './Buffer'

/**
 * Constructor options for {@link VertexBuffer}
 *
 * @public
 */
export type VertexBufferOptions = BufferOptions | BufferOptions[]

/**
 * @public
 */
export abstract class VertexBuffer {
  public abstract readonly device: Device

  /**
   *
   */
  public buffers: Buffer[] = []

  public abstract dispose(): this
}
