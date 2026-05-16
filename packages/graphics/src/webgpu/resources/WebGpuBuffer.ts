import { dataTypeToArrayType, type TypedArray } from '../../enums'
import { Buffer, isPlainBufferData, PlainBufferData, type BufferOptions } from '../../resources'
import type { WebGpuDevice } from '../WebGpuDevice'

export class WebGpuBuffer extends Buffer {
  public readonly device: WebGpuDevice
  public readonly resource: GPUBuffer
  private readWrite: boolean
  public constructor(device: WebGpuDevice, options?: BufferOptions) {
    super()
    this.device = device
    this.readWrite = options?.readWrite ?? false
    this.reset(options)
  }

  public create() {
    const self = this as Mutable<this>
    if (!self.resource) {
      let usage = 0
      if (this.isIndexBuffer) {
        usage = usage | GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
      }
      if (this.isVertexBuffer) {
        usage = usage | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
      }
      if (this.isUniformBuffer) {
        usage = usage | GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      }
      if (this.isStorageBuffer) {
        usage = usage | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
      }
      if (this.readWrite) {
        usage = usage | GPUBufferUsage.COPY_SRC
      }

      self.resource = this.device.gpu.createBuffer({
        label: this.name,
        size: this.size,
        usage: usage,
      })
    }
  }

  public dispose() {
    const self = this as Mutable<this>
    self.resource?.destroy()
    self.resource = null
  }

  public setData(src: TypedArray | ArrayBuffer | PlainBufferData, srcOffset?: number, srcLength?: number): void {
    if (isPlainBufferData(src)) {
      const ArrayType = dataTypeToArrayType(src.type)
      src = new ArrayType(src.elements)
    }

    const self = this as Mutable<this>

    let srcElementSize = ArrayBuffer.isView(src) ? src.BYTES_PER_ELEMENT : 1
    srcOffset ??= 0
    srcLength ??= src.byteLength / srcElementSize - srcOffset
    let srcByteSize = srcLength * srcElementSize

    if ((srcOffset * srcElementSize) % 4 !== 0 || (srcLength * srcElementSize) % 4 !== 0) {
      console.warn('Buffer data offset and length must be a multiple of 4 bytes. Copying data to a temporary buffer.')
      if (ArrayBuffer.isView(src)) {
        const aligned = new Uint16Array(Math.ceil(src.length / 2) * 2)
        aligned.set(src)
        src = aligned.buffer
        srcOffset = 0
        srcLength = aligned.byteLength
        srcByteSize = aligned.byteLength
      } else {
        const aligned = new Uint8Array(Math.ceil((srcLength * srcElementSize) / 4) * 4)
        aligned.set(new Uint8Array(src, srcOffset * srcElementSize, srcLength * srcElementSize))
        src = aligned.buffer
        srcOffset = 0
        srcLength = aligned.byteLength
        srcByteSize = aligned.byteLength
      }
    }

    if (self.size !== srcByteSize) {
      self.dispose()
      self.size = srcByteSize
      self.elementCount = self.size / self.stride
      self.create()
    }
    self.device.gpu.queue.writeBuffer(self.resource, 0, src, srcOffset, srcLength)
  }

  public setSubData(
    byteOffset: number,
    src: TypedArray | ArrayBuffer | PlainBufferData,
    srcOffset?: number,
    srcLength?: number,
  ) {
    if (isPlainBufferData(src)) {
      const ArrayType = dataTypeToArrayType(src.type)
      src = new ArrayType(src.elements)
    }

    const srcElementSize = ArrayBuffer.isView(src) ? src.BYTES_PER_ELEMENT : 1
    srcOffset ??= 0
    srcLength ??= src.byteLength / srcElementSize - srcOffset
    const srcByteSize = srcLength * srcElementSize
    if (byteOffset + srcByteSize > this.size) {
      throw new Error('destination byte offset and length out of bounds of the buffer size')
    }
    this.device.gpu.queue.writeBuffer(this.resource, byteOffset, src, srcOffset, srcLength)
  }
}

type Mutable<T> = {
  -readonly [K in keyof T]: T[K]
}
