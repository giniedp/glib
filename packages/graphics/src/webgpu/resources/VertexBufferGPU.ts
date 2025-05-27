import { VertexBuffer, VertexBufferOptions } from '../../resources/VertexBuffer'
import type { DeviceGPU } from '../DeviceGPU'
import { BufferGPU } from './BufferGPU'

export class VertexBufferGPU extends VertexBuffer {
  /**
   * The graphics device
   */
  public readonly device: DeviceGPU

  private vaoCache: Map<string, WebGLVertexArrayObject> = new Map()

  public constructor(device: DeviceGPU, options: VertexBufferOptions) {
    super()
    this.device = device
    this.buffers = []
    if (!Array.isArray(options)) {
      options = [options]
    }
    for (const bufferOpts of options) {
      this.buffers.push(
        new BufferGPU(device, {
          ...bufferOpts,
          type: 'VertexBuffer',
        }),
      )
    }
  }


  public dispose(): this {
    for (const buffer of this.buffers) {
      buffer.dispose()
    }
    this.buffers = []
    return this
  }
}
