import type { Device } from '../Device'
import type { Buffer, BufferOptions } from './Buffer'
import { type Ownable, ResourceOwnerSet } from './ResourceOwnerSet'

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
   * The owners of this vertex buffer
   */
  public readonly owners: ResourceOwnerSet = new ResourceOwnerSet(this)

  public constructor() {
    this.owners.onFinalize(() => this.destroy())
  }

  /**
   * Releases the underlying buffers
   */
  protected abstract destroy(): void

  /**
   * Immediately releases the GPU resources of this vertex buffer, regardless of its owners.
   */
  public dispose(): void {
    this.owners.finalize()
  }

  public getMaxVertexCount(): number {
    return Math.max(...this.buffers.map((b) => b.elementCount))
  }
}
