import { eventSource } from '@gglib/utils'
import { bufferTypeToWebGL, dataTypeToArrayType, type TypedArray } from '../../enums'
import { Buffer, isPlainBufferData, PlainBufferData, type BufferOptions } from '../../resources'
import { WebglDevice } from '../WebglDevice'
import type { WebglResource } from '../types'

/**
 * @public
 */
export class WebglBuffer extends Buffer implements WebglResource<WebGLBuffer> {
  /**
   * The graphics device
   */
  public readonly device: WebglDevice
  public readonly onDisposed = eventSource<this>()

  public readonly glHandle: WebGLBuffer
  public readonly glType: GLenum
  public readonly glUsage: GLenum

  /**
   * Creates a new Buffer
   *
   * @param device - The graphics device
   * @param opts - The creation options
   */
  public constructor(device: WebglDevice, opts: BufferOptions) {
    super()
    this.device = device
    this.reset(opts)
  }

  public create(): void {
    const mutable = this as Mutable<this>
    if (!this.glHandle || !this.device.context.isBuffer(this.glHandle)) {
      mutable.glHandle = this.device.context.createBuffer()
    }
    mutable.glType = bufferTypeToWebGL(this.type)
    mutable.glUsage = this.device.context.STATIC_DRAW // TODO:
    const gl = this.device.context
    gl.bindBuffer(this.glType, this.glHandle)
    gl.bufferData(this.glType, this.size, this.glUsage)
    gl.bindBuffer(this.glType, null)
  }

  /**
   * Releases any graphics resources.
   */
  public dispose(): void {
    if (this.device.context.isBuffer(this.glHandle)) {
      this.device.context.deleteBuffer(this.glHandle)
      ;(this as Mutable<this>).glHandle = null
    }
    this.onDisposed.emit(this)
    this.onDisposed.clear()
  }

  public setData(src: TypedArray | ArrayBuffer | PlainBufferData, srcOffset?: number, srcLength?: number): void {
    const self = this as Mutable<this>

    if (src instanceof ArrayBuffer) {
      src = new Uint8Array(src)
    } else if (isPlainBufferData(src)) {
      const ArrayType = dataTypeToArrayType(src.type)
      src = new ArrayType(src.elements)
    }

    const srcElementSize = ArrayBuffer.isView(src) ? src.BYTES_PER_ELEMENT : 1
    srcOffset ??= 0
    srcLength ??= src.byteLength / srcElementSize - srcOffset
    const srcByteSize = srcLength * srcElementSize
    if (self.size !== srcByteSize) {
      self.dispose()
      self.size = srcByteSize
      self.elementCount = self.size / self.stride
      self.create()
    }

    const gl = this.device.context
    gl.bindBuffer(this.glType, this.glHandle)
    gl.bufferData(this.glType, src, this.glUsage, srcOffset, srcLength)
    gl.bindBuffer(this.glType, null)
  }

  public setSubData(
    byteOffset: number,
    src: TypedArray | ArrayBuffer | PlainBufferData,
    srcOffset?: number,
    srcLength?: number,
  ): void {
    if (src instanceof ArrayBuffer) {
      src = new Uint8Array(src)
    } else if (isPlainBufferData(src)) {
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

    const gl = this.device.context
    gl.bindBuffer(this.glType, this.glHandle)
    gl.bufferSubData(this.glType, byteOffset, src, srcOffset, srcLength)
    gl.bindBuffer(this.glType, null)
  }

  public getBufferSubData(srcByteOffset: number, dst: ArrayBufferView, dstOffset: number, dstLength: number): void {
    const gl = this.device.context

    gl.bindBuffer(this.glType, this.glHandle)
    gl.getBufferSubData(this.glType, srcByteOffset, dst, dstOffset, dstLength)
    gl.bindBuffer(this.glType, null)
  }

  /**
   * typesafe assignment helper for readonly properties
   */
  protected assign<K extends keyof this>(key: K, value: this[K]) {
    this[key] = value
  }
}

type Mutable<T> = {
  -readonly [K in keyof T]: T[K]
}

// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices#use_non-blocking_async_data_readback
// async function getBufferSubDataAsync(
//   gl,
//   target,
//   buffer,
//   srcByteOffset,
//   dstBuffer,
//   /* optional */ dstOffset,
//   /* optional */ length,
// ) {
//   const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0)
//   gl.flush()

//   await clientWaitAsync(gl, sync, 0, 10)
//   gl.deleteSync(sync)

//   gl.bindBuffer(target, buffer)
//   gl.getBufferSubData(target, srcByteOffset, dstBuffer, dstOffset, length)
//   gl.bindBuffer(target, null)

//   return dstBuffer
// }
