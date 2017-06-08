import { logger } from '@glib/core'
import { Device } from './Device'
import { ArrayType, BufferType, BufferTypeOption, BufferUsage, BufferUsageOption, DataSize, DataType, DataTypeOption } from './enums'
import * as Enums from './enums/Enums'
import { ShaderProgram } from './ShaderProgram'
import { VertexLayout } from './VertexLayout'

export type BufferDataOption = number[] | ArrayBuffer | ArrayBufferView

export interface BufferOptions<T = BufferDataOption> {
  handle?: WebGLBuffer,
  type?: BufferTypeOption,
  usage?: BufferUsageOption,
  layout?: VertexLayout,
  data?: T,
  dataType?: DataTypeOption,
  elementSize?: number
}

export class Buffer {
  public device: Device
  public gl: WebGLRenderingContext
  public handle: WebGLBuffer
  public type: number
  public dataType: number
  public usage: number
  public dataSize: number
  public elementSize: number
  public elementCount: number
  public layout: VertexLayout

  constructor(device: Device, opts?: BufferOptions) {
    this.device = device
    this.gl = device.context
    this.setup(opts || {})
  }

  /**
   * Translates and returns the current 'type' property to a readable name.
   * Result is one of [ARRAY_BUFFER|ELEMENT_ARRAY_BUFFER]
   * This property exists purely for debugging
   */
  get typeName(): string {
    return BufferType.nameOf(this.type)
  }

  /**
   * Translates and returns the current 'usage' property to a readable name.
   * Result is one of [STATIC_DRAW|DYNAMIC_DRAW|STREAM_DRAW]
   * This property exists purely for debugging
   */
  get usageName(): string {
    return BufferUsage.nameOf(this.usage)
  }

  /**
   * Translates and returns the current 'dataType' property to a readable name.
   * This property exists purely for debugging
   */
  get dataTypeName(): string {
    return DataType.nameOf(this.dataType)
  }

  /**
   * Indicates whether this buffer is setup as an IndexBuffer
   */
  get isIndexBuffer(): boolean {
    return this.type === BufferType.IndexBuffer
  }

  /**
   * Indicates whether this buffer is setup as an VertexBuffer
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
      this.handle = opts.handle
    }
    if (!this.handle || !this.gl.isBuffer(this.handle)) {
      this.handle = this.gl.createBuffer()
    }

    // must be one of [Static|Dynamic|Stream]
    if (opts.usage) {
      this.usage = BufferUsage[opts.usage]
    } else {
      this.usage = this.usage || BufferUsage.Static
    }
    if (!this.usageName) {
      throw new Error(`invalid option 'usage': ${opts.usage}`)
    }

    // must be one of [VertexBufferIndexBuffer]
    if (opts.type) {
      this.type = BufferType[opts.type]
    } else {
      this.type = this.type || BufferType.IndexBuffer
    }
    if (!this.typeName) {
      throw new Error(`invalid or missing option 'type': ${opts.type}`)
    }

    if (opts.dataType) {
      this.dataType = DataType[opts.dataType]
      this.elementSize = opts.elementSize || DataSize[opts.dataType]
    } else if (this.isIndexBuffer) {
      this.dataType = DataType.UNSIGNED_SHORT
      this.elementSize = DataSize.UNSIGNED_SHORT
    } else {
      this.dataType = DataType.FLOAT
      this.elementSize = DataSize.FLOAT
    }
    if (opts.layout) {
      this.layout = opts.layout
      this.dataType = DataType.UNSIGNED_BYTE
      this.elementSize = VertexLayout.countBytes(this.layout)
    }
    if (!this.dataTypeName) {
      throw new Error(`invalid option 'dataType': ${opts.dataType}`)
    }

    if (this.dataSize == null) {
      this.dataSize = 0
    }

    if (opts.data) {
      this.setData(opts.data)
    }
    return this
  }

  /**
   * Releases any graphics resouces.
   */
  public destroy(): Buffer {
    if (this.gl.isBuffer(this.handle)) {
      this.gl.deleteBuffer(this.handle)
      this.handle = null
    }
    return this
  }

  /**
   * Sets this buffer on the graphics device as current vertex or index buffer depending on the 'type' property
   */
  public use(): Buffer {
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
  public useProgram(program: ShaderProgram): Buffer {
    this.use()
    for (const key in program.attributes) {
      if (program.attributes.hasOwnProperty(key)) {
        const channel = this.layout[key]
        const attribute = program.attributes[key]
        if (channel) {
          this.gl.vertexAttribPointer(
            attribute.location,
            channel.elements,
            DataType[channel.type],
            !!channel.normalize,
            this.elementSize,
            channel.offset,
          )
        }
      }
    }
    return this
  }

  /**
   *
   */
  public setData(data: BufferDataOption, srcByteOffset?: number, srcByteLength?: number): Buffer {
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
    if (!buffer) {
      throw new Error(`invalid argument 'data'. must be one of [number[] | ArrayBuffer | ArrayBufferView]`)
    }

    this.use()
    if (srcByteOffset || srcByteLength) {
      const off = srcByteOffset || 0
      const len = srcByteLength || (buffer.byteLength - off);
      // WebGL2 call
      (this.gl as any).bufferData(this.type, buffer, this.usage, off, len)
      this.dataSize = Math.min(buffer.byteLength - off, len)
    } else {
      // WebGL1 call
      this.gl.bufferData(this.type, buffer, this.usage)
      this.dataSize = buffer.byteLength
    }
    this.elementCount = this.dataSize / this.elementSize
    return this
  }

  /**
   *
   */
  public setDataElementOffset(data: BufferDataOption, srcElementOffset: number, srcElementCount: number): Buffer {
    return this.setData(data, srcElementOffset * this.elementSize, srcElementCount * this.elementSize)
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
    this.use()
    this.gl.bufferSubData(this.type, byteOffset, buffer)

    this.dataSize = Math.max(this.dataSize, byteOffset + buffer.byteLength)
    this.elementCount = this.dataSize / this.elementSize
    return this
  }

  /**
   *
   */
  public setSubDataElementOffset(data: BufferDataOption, elementOffset?: number): Buffer {
    return this.setSubData(data, elementOffset * this.elementSize)
  }

  /**
   *
   */
  public getBufferSubData(srcByteOffset: number, dst: ArrayBufferView, dstOffset: number, dstLength: number): void {
    // WebGL2 call
    this.use();
    (this.gl as any).getBufferSubData(this.type, srcByteOffset, dst, dstOffset, dstLength)
  }
}
