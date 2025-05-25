import { VertexLayout } from '../VertexLayout'

import { Device } from '../Device'
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
  type?: BufferTypeOption
  /**
   * The buffer usage. Defaults to `Static`
   */
  usage?: BufferUsageOption
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
  dataType?: DataTypeOption
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
  public type: number

  /**
   * The data element type
   */
  public dataType: number

  /**
   * The size of the data in bytes
   */
  public sizeInBytes: number

  /**
   *
   */
  public usage: number

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
   * Translates and returns the current 'type' property to a readable name.
   *
   * @remarks
   * This property exists purely for debugging
   */
  public get typeName(): string {
    return nameOfBufferType(this.type)
  }

  /**
   * Translates and returns the current 'usage' property to a readable name.
   *
   * @remarks
   * This property exists purely for debugging
   */
  public get usageName(): string {
    return nameOfBufferUsage(this.usage)
  }

  /**
   * Translates and returns the current 'dataType' property to a readable name.
   *
   * @remarks
   * This property exists purely for debugging
   */
  public get dataTypeName(): string {
    return nameOfDataType(this.dataType)
  }

  /**
   * Indicates whether this is an IndexBuffer
   */
  public get isIndexBuffer(): boolean {
    return this.type === BufferType.IndexBuffer
  }

  /**
   * Indicates whether this is a VertexBuffer
   */
  public get isVertexBuffer(): boolean {
    return this.type === BufferType.VertexBuffer
  }

  /**
   * Resets the buffer to the given options
   */
  public reset(opts: BufferOptions): this {
    // must be one of [Static|Dynamic|Stream]
    if (opts.usage) {
      this.usage = valueOfBufferUsage(opts.usage)
    } else {
      this.usage = this.usage || BufferUsage.Static
    }
    if (!this.usageName) {
      throw new Error(`invalid 'usage' option: ${opts.usage}`)
    }

    // must be one of [VertexBufferIndexBuffer]
    if (opts.type) {
      this.type = valueOfBufferType(opts.type)
    } else {
      this.type = this.type || BufferType.IndexBuffer
    }
    if (!this.typeName) {
      throw new Error(`invalid or missing 'type' option: ${opts.type}`)
    }

    if (opts.dataType) {
      // data type has been explicitly set
      this.dataType = valueOfDataType(opts.dataType)
    } else if (this.isIndexBuffer) {
      // default to ushort for IndexBuffer
      this.dataType = DataType.ushort
    } else {
      // default to float for VertexBuffer
      this.dataType = DataType.float
    }
    if (!this.dataTypeName) {
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
      this.stride = dataTypeSize(this.dataType)
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
