import { VertexLayout } from '../VertexLayout'

import { Device } from '../Device'
import {
  ArrayType,
  BufferType,
  // BufferTypeOption,
  // BufferUsage,
  // BufferUsageOption,
  DataType,
  // DataTypeOption,
  // dataTypeSize,
  // nameOfBufferType,
  // nameOfBufferUsage,
  // nameOfDataType,
  // valueOfBufferType,
  // valueOfBufferUsage,
  // valueOfDataType,
  BufferUsageHint,
  dataTypeToSize
} from '../enums'


/**
 * Data type that is accepted by the `setData*` methods
 *
 * @public
 */
export type BufferDataOption = number[] | ArrayBuffer | ArrayBufferView<ArrayBuffer>

/**
 * Constructor options for {@link Buffer}
 *
 * @public
 */
export interface BufferOptions<T = BufferDataOption> {
  /**
   * The buffer type e.b. `VertexBuffer` or `IndexBuffer`
   */
  type?: BufferType
  /**
   * The buffer usage. Defaults to `Static`
   */
  usage?: BufferUsageHint
  /**
   * The VertexBuffer layout. Usable only for vertex buffers
   */
  layout?: VertexLayout
  /**
   * The actual data to set on the buffer.
   */
  data?: T
  /**
   * The data type of a single element `data`
   *
   * @remarks
   * - For IndexBuffer defaults to `ushort`
   * - For VertexBuffer defaults to `float`
   */
  dataType?: DataType
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
export abstract class Buffer {

  public abstract readonly device: Device

  /**
   * The buffer type e.g. VertexBuffer or IndexBuffer
   */
  public type: BufferType

  /**
   * The data element type
   */
  public dataType: DataType

  /**
   * The size of the data in bytes
   */
  public sizeInBytes: number

  /**
   *
   */
  public usage: BufferUsageHint

  /**
   * Size in bytes of a single element in the buffer
   *
   * @remarks
   * - For VertexBuffer this is the size in bytes of a whole vertex.
   * - For IndexBuffer this is the size in bytes of a single index value.
   */
  public stride: number

  /**
   * The total number of elements in this buffer
   *
   * @remarks
   * - For VertexBuffer this is the count of all vertices.
   * - For IndexBuffer this is the count of all indices.
   */
  public elementCount: number

  /**
   *
   */
  public layout: VertexLayout

  /**
   * Indicates whether this is an IndexBuffer
   */
  public get isIndexBuffer(): boolean {
    return this.type === 'IndexBuffer'
  }

  /**
   * Indicates whether this is a VertexBuffer
   */
  public get isVertexBuffer(): boolean {
    return this.type === 'VertexBuffer'
  }

  /**
   * Resets the buffer to the given options
   */
  public reset(opts: BufferOptions): this {
    // must be one of [Static|Dynamic|Stream]
    this.usage = (opts.usage ?? this.usage) || 'Static'
    this.type = (opts.type ?? this.type)

    if (!this.type) {
      throw new Error(`invalid or missing 'type' option: ${opts.type}`)
    }

    if (opts.dataType) {
      // data type has been explicitly set
      this.dataType = opts.dataType
    } else if (this.isIndexBuffer) {
      // default to ushort for IndexBuffer
      this.dataType = 'uint16'
    } else {
      // default to float for VertexBuffer
      this.dataType = 'float32'
    }
    if (!this.dataType) {
      throw new Error(`invalid 'dataType' option: ${opts.dataType}`)
    }

    if (opts.layout) {
      this.layout = opts.layout
    } else if (this.isVertexBuffer) {
      throw new Error(`missing 'layout' option for VertexBuffer`)
    } else {
      this.layout = {}
    }

    if (opts.stride != null) {
      this.stride = opts.stride
    } else if (this.isVertexBuffer) {
      this.stride = VertexLayout.countBytes(this.layout)
    } else {
      this.stride = dataTypeToSize(this.dataType)
    }

    if (this.sizeInBytes == null) {
      this.sizeInBytes = 0
    }

    this.create()

    if (opts.data) {
      this.setData(opts.data)
    }
    return this
  }

  public abstract create(): this

  public abstract dispose(): this

  public abstract bind(): this

  public abstract setData(src: BufferDataOption, srcByteOffset?: number, srcByteLength?: number): this
  public abstract setSubData(byteOffset: number, src: BufferDataOption, srcByteOffset?: number, srcByteLength?: number): this

  public setDataElementOffset(data: BufferDataOption, srcElementOffset: number, srcElementCount: number): this {
    return this.setSubDataElementOffset(0, data, srcElementOffset, srcElementCount)
  }
  public setSubDataElementOffset(elementOffset: number, src: BufferDataOption, srcElementOffset: number, srcElementCount: number): this {
    return this.setSubData(elementOffset * this.stride, src, srcElementOffset * this.stride, srcElementCount * this.stride)
  }

  public abstract getBufferSubData(
    srcByteOffset: number,
    dst: ArrayBufferView,
    dstOffset: number,
    dstLength: number,
  ): this

  public getData(): ArrayBufferView {

    const length = VertexLayout.countElements(this.layout) * this.elementCount
    const array = ArrayType[this.dataType]
    const dst = new array(length)
    this.getBufferSubData(0, dst, 0, length)
    return dst
  }

  protected convertDataOption(src: BufferDataOption): ArrayBufferView<ArrayBuffer> {
    if (src && 'buffer' in src) {
      return src as ArrayBufferView<ArrayBuffer>
    }
    if (src instanceof Array) {
      if (this.isIndexBuffer) {
        return new ArrayType[this.dataType](src)
      }
      return VertexLayout.convertArrayToBufferView(src, this.layout)
    }
    if (src instanceof ArrayBuffer) {
      return new DataView(src)
    }
    throw new Error(`invalid argument 'src'. must be one of [number[] | ArrayBuffer | ArrayBufferView]`)
  }
}
