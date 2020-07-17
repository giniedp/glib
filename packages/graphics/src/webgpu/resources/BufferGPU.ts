import { BufferType, BufferUsage } from '../../enums'
import { Buffer, BufferDataOption, BufferOptions } from '../../resources/Buffer'
import { DeviceGPU } from '../DeviceGPU'

/**
 * @public
 */
export class BufferGPU extends Buffer {
  /**
   * The graphics device
   */
  public readonly device: DeviceGPU

  public get handle() {
    return this.$handle
  }

  private $handle: GPUBuffer

  /**
   * Creates a new Buffer
   *
   * @param device - The graphics device
   * @param opts - The creation options
   */
  constructor(device: DeviceGPU, opts?: BufferOptions) {
    super()
    this.device = device
    this.init(opts || {})
  }

  public create(): this {
    if (!this.handle) {

      let usage = GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
      if (this.isIndexBuffer) {

        usage = usage | GPUBufferUsage.INDEX
      }
      if (this.isVertexBuffer) {

        usage = usage | GPUBufferUsage.VERTEX
      }
      switch (this.usage) {
        case BufferUsage.Dynamic:
          // TODO:
          break
        case BufferUsage.Static:
          // TODO:
          break
        case BufferUsage.Stream:
          // TODO:
          break
        default:
          break
      }

      this.$handle = this.device.device.createBuffer({
        size: this.sizeInBytes,
        usage: usage,
      })
    }
    return this
  }

  /**
   * Releases any graphics resources.
   */
  public destroy(): this {
    if (this.handle) {
      this.handle.destroy()
      this.$handle = null
    }
    return this
  }

  /**
   * Sets this buffer on the graphics device as current vertex or index buffer depending on the 'type' property
   */
  public bind(): this {
    if (this.type === BufferType.VertexBuffer) {
      this.device.vertexBuffer = this
    } else if (this.type === BufferType.IndexBuffer) {
      this.device.indexBuffer = this
    } else {
      throw new Error(`unknown buffer type: ${this.type}`)
    }
    return this
  }

  /**
   *
   */
  public setData(
    src: BufferDataOption,
    srcByteOffset?: number,
    srcByteLength?: number,
  ): this {
    const data = this.convertDataOption(src)
    const off = srcByteOffset || 0
    const len = srcByteLength || (data.byteLength - off)
    if (len !== this.sizeInBytes) {
      this.destroy()
      this.$sizeInBytes = len
      this.$elementCount = this.sizeInBytes / this.stride
      this.create()
    }
    // TODO: https://github.com/gpuweb/gpuweb/blob/main/design/BufferOperations.md
    throw new Error('not implemented')
    return this
  }

  /**
   *
   */
  public setSubData(
    byteOffset: number,
    src: BufferDataOption,
    srcByteOffset?: number,
    srcByteLength?: number,
  ): this {
    const data = this.convertDataOption(src)
    byteOffset = byteOffset || 0
    const off = srcByteOffset || 0
    const len = srcByteLength || (data.byteLength - off)
    // TODO: https://github.com/gpuweb/gpuweb/blob/main/design/BufferOperations.md
    throw new Error('not implemented')
    return this
  }

  /**
   *
   */
  public getBufferSubData(
    srcByteOffset: number,
    dst: ArrayBufferView,
    dstOffset: number,
    dstLength: number,
  ): this {
    throw new Error(`not supported`)
  }
}
