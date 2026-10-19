import { eventSource } from '@gglib/utils'
import { bufferUsageToWebGL, type TypedArray } from '../../enums'
import { Buffer, isPlainBufferData, materializePlainBuffer, PlainBufferData, type BufferOptions } from '../../resources'
import { SamplerState } from '../../states'
import { STORAGE_TEXEL_SIZE, STORAGE_TEXTURE_WIDTH } from '../glsl/glsl-storage'
import type { WebglResource } from '../types'
import { WebglDevice } from '../WebglDevice'
import type { WebglTexture } from './WebglTexture'

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

  private storageTexture: WebglTexture | null = null
  private storageDirtyStart = Infinity
  private storageDirtyEnd = -Infinity

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

    mutable.glType = bufferUsageToWebGL(this.usage)
    mutable.glUsage = this.device.context.STATIC_DRAW // TODO:
    const gl = this.device.context
    const vao = this.bind()
    gl.bufferData(this.glType, this.allocationSize, this.glUsage)
    this.unbind(vao)
    this.markStorageDirty(0, this.size)
  }

  /**
   * Storage buffers are allocated in whole texels, so the last texel can be uploaded to the texture
   */
  private get allocationSize(): number {
    return this.isStorageBuffer ? Math.ceil(this.size / STORAGE_TEXEL_SIZE) * STORAGE_TEXEL_SIZE : this.size
  }

  /**
   * Releases the WebGL buffer object. The buffer may be recreated with {@link create}.
   */
  protected destroy(): void {
    if (this.storageTexture) {
      this.ownership.drop(this.storageTexture)
      this.storageTexture = null
    }
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
      src = materializePlainBuffer(src, this.vertexLayout)
    }

    const srcElementSize = ArrayBuffer.isView(src) ? src.BYTES_PER_ELEMENT : 1
    srcOffset ??= 0
    srcLength ??= src.byteLength / srcElementSize - srcOffset
    const srcByteSize = srcLength * srcElementSize
    if (self.size !== srcByteSize) {
      this.destroy()
      self.size = srcByteSize
      self.elementCount = self.size / self.stride
      self.create()
    }

    const gl = this.device.context
    const vao = this.bind()
    if (this.allocationSize !== srcByteSize) {
      gl.bufferSubData(this.glType, 0, src, srcOffset, srcLength)
    } else {
      gl.bufferData(this.glType, src, this.glUsage, srcOffset, srcLength)
    }
    this.unbind(vao)
    this.markStorageDirty(0, srcByteSize)
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
      src = materializePlainBuffer(src, this.vertexLayout)
    }

    const srcElementSize = ArrayBuffer.isView(src) ? src.BYTES_PER_ELEMENT : 1
    srcOffset ??= 0
    srcLength ??= src.byteLength / srcElementSize - srcOffset
    const srcByteSize = srcLength * srcElementSize
    if (byteOffset + srcByteSize > this.size) {
      throw new Error('destination byte offset and length out of bounds of the buffer size')
    }

    const gl = this.device.context
    const vao = this.bind()
    gl.bufferSubData(this.glType, byteOffset, src, srcOffset, srcLength)
    this.unbind(vao)
    this.markStorageDirty(byteOffset, srcByteSize)
  }

  private markStorageDirty(byteOffset: number, byteLength: number) {
    if (this.isStorageBuffer) {
      this.storageDirtyStart = Math.min(this.storageDirtyStart, byteOffset)
      this.storageDirtyEnd = Math.max(this.storageDirtyEnd, byteOffset + byteLength)
    }
  }

  /**
   * Returns the float texture that mirrors this storage buffer, after uploading the changed rows
   *
   * @remarks
   * WebGL has no storage buffers. The data is copied on the GPU into an `rgba32float` texture with
   * {@link STORAGE_TEXTURE_WIDTH} texels per row, one texel holds 16 bytes. Shaders read it with `texelFetch`.
   */
  public syncStorageTexture(): WebglTexture {
    const texels = Math.max(1, Math.ceil(this.size / STORAGE_TEXEL_SIZE))
    const height = Math.ceil(texels / STORAGE_TEXTURE_WIDTH)
    let texture = this.storageTexture
    if (!texture || texture.height !== height) {
      if (texture) {
        this.ownership.drop(texture)
      }
      texture = this.ownership.adopt(
        this.device.createTexture({
          name: `${this.name || 'Buffer'} Storage`,
          format: 'rgba32float',
          width: STORAGE_TEXTURE_WIDTH,
          height,
          mipLevelCount: 1,
        }),
      )
      this.storageTexture = texture
      this.storageDirtyStart = 0
      this.storageDirtyEnd = this.size
    }
    if (this.storageDirtyEnd <= this.storageDirtyStart) {
      return texture
    }

    const firstRow = Math.floor(this.storageDirtyStart / STORAGE_TEXEL_SIZE / STORAGE_TEXTURE_WIDTH)
    const lastRow = Math.ceil(Math.min(this.storageDirtyEnd / STORAGE_TEXEL_SIZE, texels) / STORAGE_TEXTURE_WIDTH)
    const fullRows = Math.floor(texels / STORAGE_TEXTURE_WIDTH)
    const rowSize = STORAGE_TEXTURE_WIDTH * STORAGE_TEXEL_SIZE

    const gl = this.device.context
    this.device.textureUnits[0].activate(texture, SamplerState.PointClamp)
    gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, this.glHandle)
    const rows = Math.min(lastRow, fullRows) - firstRow
    if (rows > 0) {
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        0,
        firstRow,
        STORAGE_TEXTURE_WIDTH,
        rows,
        gl.RGBA,
        gl.FLOAT,
        firstRow * rowSize,
      )
    }
    if (lastRow > fullRows) {
      // the last row is not complete, the buffer ends before
      const width = texels - fullRows * STORAGE_TEXTURE_WIDTH
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, fullRows, width, 1, gl.RGBA, gl.FLOAT, fullRows * rowSize)
    }
    gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, null)

    this.storageDirtyStart = Infinity
    this.storageDirtyEnd = -Infinity
    return texture
  }

  public getBufferSubData(srcByteOffset: number, dst: ArrayBufferView, dstOffset: number, dstLength: number): void {
    const gl = this.device.context

    const vao = this.bind()
    gl.getBufferSubData(this.glType, srcByteOffset, dst, dstOffset, dstLength)
    this.unbind(vao)
  }

  /**
   * Binds the buffer to its target.
   *
   * @remarks
   * The element array buffer binding is part of the vertex array object state. Any bound
   * vertex array object is unbound first, otherwise its index buffer binding would be replaced.
   *
   * @returns the previously bound vertex array object, to be restored with {@link unbind}
   */
  private bind(): WebGLVertexArrayObject | null {
    const gl = this.device.context
    let vao: WebGLVertexArrayObject | null = null
    if (this.glType === gl.ELEMENT_ARRAY_BUFFER) {
      vao = gl.getParameter(gl.VERTEX_ARRAY_BINDING)
      if (vao) {
        gl.bindVertexArray(null)
      }
    }
    gl.bindBuffer(this.glType, this.glHandle)
    return vao
  }

  private unbind(vao: WebGLVertexArrayObject | null) {
    const gl = this.device.context
    gl.bindBuffer(this.glType, null)
    if (vao) {
      gl.bindVertexArray(vao)
    }
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
