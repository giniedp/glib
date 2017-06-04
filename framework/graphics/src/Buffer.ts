import { logger } from '@glib/core'
import { Device } from './Device'
import { ArrayType, BufferType, BufferUsage, DataSize, DataType } from './enums'
import { ShaderProgram } from './ShaderProgram'
import { IVertexLayout, VertexLayout } from './VertexLayout'

export interface BufferData {
  length: number
  [index: number]: number
  push(value: number): void
}

export interface BufferOptions {
  handle?: WebGLBuffer,
  type?: string|number,
  usage?: string|number,
  layout?: IVertexLayout,
  data?: BufferData,
  dataType?: string|number,
  elementSize?: number
}

export class Buffer {
  public device: Device
  public gl: any
  public handle: WebGLBuffer
  public type: number
  public dataType: number
  public usage: number
  public dataSize: number
  public elementSize: number
  public elementCount: number
  public layout: IVertexLayout

  constructor(device: Device, opts?: BufferOptions) {
    this.device = device
    this.gl = device.context
    this.setup(opts || {})
  }

  // Translates and returns the current 'type' property to a readable name.
  // Result is one of [ARRAY_BUFFER|ELEMENT_ARRAY_BUFFER]
  // This property exists purely for debugging
  get typeName(): string {
    return BufferType.nameOf(this.type)
  }

  // Translates and returns the current 'usage' property to a readable name.
  // Result is one of [STATIC_DRAW|DYNAMIC_DRAW|STREAM_DRAW]
  // This property exists purely for debugging
  get usageName(): string {
    return BufferUsage.nameOf(this.usage)
  }

  // Translates and returns the current 'dataType' property to a readable name.
  // This property exists purely for debugging
  get dataTypeName(): string {
    return DataType.nameOf(this.dataType)
  }

  // Indicates whether this buffer is setup as an IndexBuffer
  get isIndexBuffer(): boolean {
    return this.type === BufferType.IndexBuffer
  }
  // Indicates whether this buffer is setup as an VertexBuffer
  get isVertexBuffer(): boolean {
    return this.type === BufferType.VertexBuffer
  }

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
      logger.warn('[Buffer]', `invalid 'usage' option`, opts)
    }

    // must be one of [VertexBufferIndexBuffer]
    if (opts.type) {
      this.type = BufferType[opts.type]
    } else {
      this.type = this.type || BufferType.IndexBuffer
    }
    if (!this.typeName) {
      logger.warn('[Buffer]', `invalid or missing 'type' option`, opts)
      this.type = BufferType.IndexBuffer
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
      logger.warn('[Buffer]', `invalid 'dataType' option`, opts)
    }

    if (opts.data) {
      this.setData(opts.data)
    }
    return this
  }

  // Releases any graphics resouces.
  public destroy(): Buffer {
    if (this.gl.isBuffer(this.handle)) {
      this.gl.deleteBuffer(this.handle)
      this.handle = null
    }
    return this
  }

  // Sets this buffer on the graphics device as current vertex or index buffer
  // depending on the 'type' property
  public use(): Buffer {
    if (this.type === BufferType.VertexBuffer) {
      this.device.vertexBuffer = this
    } else if (this.type === BufferType.IndexBuffer) {
      this.device.indexBuffer = this
    } else {
      // TODO: log error
    }
    return this
  }

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

  public setData(data: any): Buffer {
    if (this.isIndexBuffer) {
      let buffer: ArrayBuffer
      if (data instanceof Array) {
        buffer = new ArrayType[this.dataType](data).buffer
      } else if (data instanceof ArrayBuffer) {
        buffer = data as any
      } else if (data instanceof ArrayType[this.dataType]) {
        buffer = data.buffer
      }
      if (!buffer) {
        throw new Error(`invalid argument 'data'. must be one of [number[]|${ArrayType.nameOf(this.dataType)}|ArrayBuffer]`)
      }

      this.use()
      this.gl.bufferData(this.type, buffer, this.usage)

      this.dataSize = buffer.byteLength
      this.elementCount = this.dataSize / this.elementSize
    } else {
      let buffer: ArrayBuffer
      if (data instanceof Array) {
        buffer = VertexLayout.convertArrayToArrayBuffer(data, this.layout)
      } else if (data instanceof ArrayBuffer) {
        buffer = data as any
      } else if (data.buffer instanceof ArrayBuffer) {
        buffer = data.buffer
      }
      if (!buffer) {
        throw new Error(`invalid argument 'data'. must be one of [number[]|TypedArray|ArrayBuffer]`)
      }

      this.use()
      this.gl.bufferData(this.type, buffer, this.usage)

      this.dataSize = buffer.byteLength
      this.elementCount = this.dataSize / this.elementSize
    }
    return this
  }

  public setSubData(data: BufferData, elementOffset?: number): Buffer {
    if (data instanceof Array) {
      data = new ArrayType[this.dataType](data)
    }
    elementOffset = elementOffset || 0
    this.use()
    this.gl.bufferSubData(this.type, elementOffset * this.elementSize, data)

    // TODO: check implementation of dataLength calculation
    let length = Math.max(data.length, elementOffset + data.length)
    this.dataSize = length * DataSize[this.dataType]
    this.elementCount = this.dataSize / this.elementSize
    return this
  }
}
