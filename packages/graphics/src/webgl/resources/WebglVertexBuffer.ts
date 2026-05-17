import { eventSource } from '@gglib/utils'
import { VertexBuffer, type VertexBufferOptions } from '../../resources'
import type { WebglDevice } from '../WebglDevice'
import { WebglBuffer } from './WebglBuffer'

export class WebglVertexBuffer extends VertexBuffer {
  public readonly device: WebglDevice
  public readonly buffers: WebglBuffer[]
  public readonly onDisposed = eventSource<this>()

  public constructor(device: WebglDevice, options: VertexBufferOptions) {
    super()
    this.device = device
    this.buffers = []
    if (!Array.isArray(options)) {
      throw new Error('Vertex buffer options must be an array')
    }
    if (!options.length) {
      throw new Error('At least one vertex buffer option must be provided')
    }
    for (const settings of options) {
      this.buffers.push(
        new WebglBuffer(device, {
          ...settings,
          type: 'VertexBuffer',
        }),
      )
    }
  }

  public dispose(): void {
    for (const buffer of this.buffers) {
      buffer.dispose()
    }
    this.buffers.length = 0
    this.onDisposed.emit(this)
    this.onDisposed.clear()
  }
}
