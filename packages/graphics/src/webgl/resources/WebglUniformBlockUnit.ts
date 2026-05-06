import type { WebglDevice } from '../WebglDevice'
import type { WebglBuffer } from './WebglBuffer'

export class WebglUniformBlockUnit {
  public readonly device: WebglDevice
  public readonly index: number

  public changed: boolean = false

  private buffer: WebGLBuffer

  public constructor(device: WebglDevice, index: number) {
    this.device = device
    this.index = index
  }

  /**
   * Sets the buffer but does not commit to GPU.
   */
  public set(buffer: WebglBuffer): void {
    if (buffer && !buffer.isUniformBuffer) {
      throw new Error('Buffer must be a uniform buffer')
    }
    if (this.buffer !== buffer?.glHandle) {
      this.buffer = buffer?.glHandle
      this.changed = true
    }
  }

  /**
   * Commits the binding to the GPU.
   */
  public commit(force: boolean): void {
    if (this.changed || force) {
      const gl = this.device.context
      gl.bindBufferBase(gl.UNIFORM_BUFFER, this.index, this.buffer)
      this.changed = false
    }
  }

  public update(buffer: WebglBuffer): void {
    this.set(buffer)
    this.commit(false)
  }
}
