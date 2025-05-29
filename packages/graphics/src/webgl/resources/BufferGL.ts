import { Buffer, BufferDataOption, BufferOptions } from '../../resources/Buffer'
import { DeviceGL } from '../DeviceGL'
import { isWebGL2 } from '../utils'

/**
 * @public
 */
export class BufferGL extends Buffer {
  /**
   * The graphics device
   */
  public readonly device: DeviceGL

  public resource: WebGLBuffer
  /**
   * Creates a new Buffer
   *
   * @param device - The graphics device
   * @param opts - The creation options
   */
  constructor(device: DeviceGL, opts?: BufferOptions) {
    super()
    this.device = device
    this.reset(opts || {})
  }

  public create(): this {
    if (!this.resource || !this.device.context.isBuffer(this.resource)) {
      this.resource = this.device.context.createBuffer()
    }
    return this
  }

  /**
   * Releases any graphics resources.
   */
  public dispose(): this {
    if (this.device.context.isBuffer(this.resource)) {
      this.device.context.deleteBuffer(this.resource)
      this.resource = null
    }
    return this
  }

  /**
   * Sets this buffer on the graphics device as current vertex or index buffer depending on the 'type' property
   */
  public bind(): this {
    this.device.context.bindBuffer(this.type, this.resource)
    return this
  }

  public unbind(): this {
    this.device.context.bindBuffer(this.type, null)
    return this
  }

  /**
   *
   */
  public setData(src: BufferDataOption, srcByteOffset?: number, srcByteLength?: number): this {
    const data = this.convertDataOption(src)
    this.bind()
    const off = srcByteOffset || 0
    const len = srcByteLength || (data.byteLength - off)

    if (off === 0 && len === data.byteLength) {
      this.device.context.bufferData(
        this.type,
        data,
        this.usage,
      )
      this.sizeInBytes = data.byteLength
    } else if (isWebGL2(this.device.context)) {
      this.device.context.bufferData(
        this.type,
        data,
        this.usage,
        off,
        len,
      )
      this.sizeInBytes = Math.min(data.byteLength - off, len)
    } else {
      throw new Error(`setData with srcByteOffset > 0 is not supported in WebGL1`)
    }

    this.elementCount = this.sizeInBytes / this.stride
    this.unbind()
    return this
  }

  /**
   *
   */
  public setSubData(byteOffset: number, src: BufferDataOption, srcByteOffset?: number, srcByteLength?: number): this {
    const data = this.convertDataOption(src)

    this.bind()
    byteOffset = byteOffset || 0
    const off = srcByteOffset || 0
    const len = srcByteLength || (data.byteLength - off)
    this.device.context.bufferSubData(this.type, byteOffset, data, off, len)

    this.unbind()
    return this
  }

  /**
   *
   */
  public getBufferSubData(srcByteOffset: number, dst: ArrayBufferView, dstOffset: number, dstLength: number): this {
    this.bind()

    if (isWebGL2(this.device.context)) {
      this.device.context.getBufferSubData(this.type, srcByteOffset, dst, dstOffset, dstLength)
    } else {
      throw new Error(`getBufferSubData is not supported in WebGL1`)
    }

    this.unbind()
    return this
  }
}
