import type { Device } from '../Device'
import type { Buffer, BufferOptions } from './Buffer'

/**
 * Constructor options for {@link VertexBuffer}
 *
 * @public
 */
export type VertexBufferOptions = Array<Omit<BufferOptions, 'type'>>

/**
 * @public
 */
export abstract class VertexBuffer {
  public abstract readonly device: Device
  public abstract readonly buffers: Buffer[]
  public abstract dispose(): void

  // public get vertexCount() {
  //   return this.buffers[0]?.elementCount || 0
  // }

  public getMaxVertexCount(): number {
    return Math.max(...this.buffers.map((b) => b.elementCount))
  }
}
