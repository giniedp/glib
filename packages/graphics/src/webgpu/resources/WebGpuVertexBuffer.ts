import { BufferUsage } from '../../enums'
import { VertexBuffer, type VertexBufferOptions } from '../../resources'
import type { WebGpuDevice } from '../WebGpuDevice'
import { WebGpuBuffer } from './WebGpuBuffer'

export class WebGpuVertexBuffer extends VertexBuffer {
  public readonly device: WebGpuDevice

  public buffers: WebGpuBuffer[] = []

  public constructor(device: WebGpuDevice, options: VertexBufferOptions) {
    super()
    this.device = device
    this.buffers = []
    if (!Array.isArray(options)) {
      options = [options]
    }
    for (const bufferOpts of options) {
      const usage = (bufferOpts.usage ?? 0) | BufferUsage.VERTEX
      const buffer = new WebGpuBuffer(device, {
        ...bufferOpts,
        usage: usage,
      })
      this.buffers.push(buffer)
    }
  }
  protected destroy(): void {
    for (const buffer of this.buffers) {
      // shared default inputs belong to the device
      if (!this.device.isDefaultVertexBuffer(buffer)) {
        buffer.dispose()
      }
    }
    this.buffers = []
  }
}
