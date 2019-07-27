import { Device } from './Device'
import { VertexLayout } from './VertexLayout'

import {
  ArrayType,
  BufferType,
  BufferTypeOption,
  BufferUsage,
  BufferUsageOption,
  DataType,
  DataTypeOption,
  dataTypeSize,
  nameOfBufferType,
  nameOfBufferUsage,
  nameOfDataType,
  valueOfBufferType,
  valueOfBufferUsage,
  valueOfDataType,
} from './enums'

/**
 * Data type that is accepted by the `setData*` methods
 *
 * @public
 */
export type BufferDataOption = number[] | ArrayBuffer | ArrayBufferView

/**
 * Constructor options for {@link Buffer}
 *
 * @public
 */
export interface BufferOptions<T = BufferDataOption> {
  /**
   * The {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGLBuffer} object to be reused
   */
  handle?: WebGLBuffer,
  /**
   * The buffer type e.b. `VertexBuffer` or `IndexBuffer`
   */
  type?: BufferTypeOption,
  /**
   * The buffer usage. Defaults to `Static`
   */
  usage?: BufferUsageOption,
  /**
   * The VertexBuffer layout. Usable only for vertex buffers
   */
  layout?: VertexLayout,
  /**
   * The actual data to set on the buffer.
   */
  data?: T,
  /**
   * The data type of a single element `data`
   *
   * @remarks
   * - For IndexBuffer defaults to `ushort`
   * - For VertexBuffer defaults to `float`
   */
  dataType?: DataTypeOption,
  /**
   * Size in bytes of a single element in the buffer
   *
   * @remarks
   * - For VertexBuffer this is the size in bytes of a whole vertex.
   * - For IndexBuffer this is the size in bytes of a single index element.
   */
  stride?: number
}

/**
 * @public
 */
export class Buffer {
  /**
   * The graphics device
   */
  public readonly device: Device

  private $handle: WebGLBuffer
  /**
   * The `WebGLBuffer` instance
   */
  public get handle(): WebGLBuffer {
    return this.$handle
  }

  private $type: number
  /**
   * The buffer type e.g. VertexBuffer or IndexBuffer
   */
  public get type(): number {
    return this.$type
  }

  private $data: ArrayBuffer | ArrayBufferView
  /**
   * The data that has being set on this buffer
   */
  public get data(): ArrayBuffer | ArrayBufferView {
    return this.$data
  }

  private $dataType: number
  /**
   * The data element type
   */
  public get dataType(): number {
    return this.$dataType
  }

  private $sizeInBytes: number
  /**
   * The size of the data in bytes
   */
  public get sizeInBytes(): number {
    return this.$sizeInBytes
  }

  private $usage: number
  /**
   *
   */
  public get usage(): number {
    return this.$usage
  }

  private $stride: number
  /**
   * Size in bytes of a single element in the buffer
   *
   * @remarks
   * - For VertexBuffer this is the size in bytes of a whole vertex.
   * - For IndexBuffer this is the size in bytes of a single index value.
   */
  public get stride(): number {
    return this.$stride
  }

  private $elementCount: number
  /**
   * The total number of elements in this buffer
   *
   * @remarks
   * - For VertexBuffer this is the count of all vertices.
   * - For IndexBuffer this is the count of all indices.
   */
  public get elementCount(): number {
    return this.$elementCount
  }

  private $layout: VertexLayout
  /**
   *
   */
  public get layout(): VertexLayout {
    return this.$layout
  }

  /**
   * Creates a new Buffer
   *
   * @param device - The graphics device
   * @param opts - The creation options
   */
  constructor(device: Device, opts?: BufferOptions) {
    this.device = device
    this.setup(opts || {})
  }

  /**
   * Translates and returns the current 'type' property to a readable name.
   *
   * @remarks
   * This property exists purely for debugging
   */
  get typeName(): string {
    return nameOfBufferType(this.type)
  }

  /**
   * Translates and returns the current 'usage' property to a readable name.
   *
   * @remarks
   * This property exists purely for debugging
   */
  get usageName(): string {
    return nameOfBufferUsage(this.usage)
  }

  /**
   * Translates and returns the current 'dataType' property to a readable name.
   *
   * @remarks
   * This property exists purely for debugging
   */
  get dataTypeName(): string {
    return nameOfDataType(this.dataType)
  }

  /**
   * Indicates whether this is an IndexBuffer
   */
  get isIndexBuffer(): boolean {
    return this.type === BufferType.IndexBuffer
  }

  /**
   * Indicates whether this is a VertexBuffer
   */
  get isVertexBuffer(): boolean {
    return this.type === BufferType.VertexBuffer
  }

  /**
   *
   */
  public setup(opts: BufferOptions): Buffer {
    if (opts.handle) {
      this.destroy()
      this.$handle = opts.handle
    }
    if (!this.handle || !this.device.context.isBuffer(this.handle)) {
      this.$handle = this.device.context.createBuffer()
    }

    // must be one of [Static|Dynamic|Stream]
    if (opts.usage) {
      this.$usage = valueOfBufferUsage(opts.usage)
    } else {
      this.$usage = this.usage || BufferUsage.Static
    }
    if (!this.usageName) {
      throw new Error(`invalid 'usage' option: ${opts.usage}`)
    }

    // must be one of [VertexBufferIndexBuffer]
    if (opts.type) {
      this.$type = valueOfBufferType(opts.type)
    } else {
      this.$type = this.type || BufferType.IndexBuffer
    }
    if (!this.typeName) {
      throw new Error(`invalid or missing 'type' option: ${opts.type}`)
    }

    if (opts.dataType) {
      // data type has been explicitly set
      this.$dataType = valueOfDataType(opts.dataType)
    } else if (this.isIndexBuffer) {
      // default to ushort for IndexBuffer
      this.$dataType = DataType.ushort
    } else {
      // default to float for VertexBuffer
      this.$dataType = DataType.float
    }
    if (!this.dataTypeName) {
      throw new Error(`invalid 'dataType' option: ${opts.dataType}`)
    }

    if (opts.layout) {
      this.$layout = opts.layout
    } else if (this.isVertexBuffer) {
        throw new Error(`missing 'layout' option for VertexBuffer`)
    } else {
      this.$layout = {}
    }

    if (opts.stride != null) {
      this.$stride = opts.stride
    } else if (this.isVertexBuffer) {
      this.$stride = VertexLayout.countBytes(this.layout)
    } else {
      this.$stride = dataTypeSize(this.dataType)
    }

    if (this.sizeInBytes == null) {
      this.$sizeInBytes = 0
    }

    if (opts.data) {
      this.setData(opts.data)
    }
    return this
  }

  /**
   * Releases any graphics resources.
   */
  public destroy(): Buffer {
    if (this.device.context.isBuffer(this.handle)) {
      this.device.context.deleteBuffer(this.handle)
      this.$handle = null
    }
    return this
  }

  /**
   * Sets this buffer on the graphics device as current vertex or index buffer depending on the 'type' property
   */
  public bind(): Buffer {
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
  public setData(data: BufferDataOption, srcByteOffset?: number, srcByteLength?: number): Buffer {
    let buffer: ArrayBuffer | ArrayBufferView
    if (data instanceof Array) {
      if (this.isIndexBuffer) {
        buffer = new ArrayType[this.dataType](data)
      } else {
        buffer = VertexLayout.convertArrayToArrayBuffer(data, this.layout)
      }
    } else if (data instanceof ArrayBuffer) {
      buffer = data
    } else if (data && (data as ArrayBufferView).buffer) {
      buffer = (data as ArrayBufferView)
    }
    if (!buffer) {
      throw new Error(`invalid argument 'data'. must be one of [number[] | ArrayBuffer | ArrayBufferView]`)
    }
    this.$data = buffer

    this.bind()
    if (srcByteOffset || srcByteLength) {
      const off = srcByteOffset || 0
      const len = srcByteLength || (buffer.byteLength - off);
      // WebGL2 call
      (this.device.context as WebGL2RenderingContext).bufferData(this.type, buffer as any, this.usage, off, len)
      this.$sizeInBytes = Math.min(buffer.byteLength - off, len)
    } else {
      // WebGL1 call
      (this.device.context as WebGLRenderingContext).bufferData(this.type, buffer as any, this.usage)
      this.$sizeInBytes = buffer.byteLength
    }
    this.$elementCount = this.sizeInBytes / this.stride
    return this
  }

  /**
   *
   */
  public setDataElementOffset(data: BufferDataOption, srcElementOffset: number, srcElementCount: number): Buffer {
    return this.setData(data, srcElementOffset * this.stride, srcElementCount * this.stride)
  }

  /**
   *
   */
  public setSubData(data: BufferDataOption, byteOffset?: number): Buffer {
    let buffer: ArrayBuffer
    if (data instanceof Array) {
      if (this.isIndexBuffer) {
        buffer = new ArrayType[this.dataType](data).buffer
      } else {
        buffer = VertexLayout.convertArrayToArrayBuffer(data, this.layout)
      }
    } else if (data instanceof ArrayBuffer) {
      buffer = data
    } else if (data && (data as ArrayBufferView).buffer instanceof ArrayBuffer) {
      buffer = (data as ArrayBufferView).buffer
    }
    byteOffset = byteOffset || 0
    this.bind();
    (this.device.context as WebGLRenderingContext).bufferSubData(this.type, byteOffset, buffer)

    this.$sizeInBytes = Math.max(this.sizeInBytes, byteOffset + buffer.byteLength)
    this.$elementCount = this.sizeInBytes / this.stride
    return this
  }

  /**
   *
   */
  public setSubDataElementOffset(data: BufferDataOption, elementOffset?: number): Buffer {
    return this.setSubData(data, elementOffset * this.stride)
  }

  /**
   *
   */
  public getBufferSubData(srcByteOffset: number, dst: ArrayBufferView, dstOffset: number, dstLength: number): void {
    // WebGL2 call
    this.bind();
    (this.device.context as WebGL2RenderingContext).getBufferSubData(this.type, srcByteOffset, dst, dstOffset, dstLength)
  }
}
