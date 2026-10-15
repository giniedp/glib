import type { Device } from '../Device'
import type { Buffer, BufferOptions } from './Buffer'
import { type Ownable, ResourceOwnership } from './ResourceOwnership'

/**
 * Constructor options for {@link VertexBuffer}
 *
 * @public
 */
export type VertexBufferOptions = Array<Omit<BufferOptions, 'type' | 'scope'>>

/**
 * @public
 */
export abstract class VertexBuffer implements Ownable {
  public abstract readonly device: Device
  public abstract readonly buffers: Buffer[]

  /**
   * The ownership state of this vertex buffer
   */
  public readonly ownership: ResourceOwnership = new ResourceOwnership(this)

  public constructor() {
    this.ownership.onFinalize(() => this.destroy())
  }

  /**
   * Releases the underlying buffers
   */
  protected abstract destroy(): void

  /**
   * Immediately releases the GPU resources of this vertex buffer, regardless of its owners.
   */
  public dispose(): void {
    this.ownership.finalize()
  }

  public getMaxVertexCount(): number {
    return Math.max(...this.buffers.map((b) => b.elementCount))
  }
}
