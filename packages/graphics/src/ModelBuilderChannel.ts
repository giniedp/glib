import { Buffer, BufferOptions } from './resources'
import { VertexLayout } from './VertexLayout'
import { ArrayLike } from '@gglib/math'

/**
 * @public
 */
export interface ModelBuilderChannelMap {
  [key: string]: ModelBuilderChannel
}

/**
 * @public
 */
export class ModelBuilderChannel {

  /**
   * The vertex stride of the current buffer
   *
   * @remarks
   * For example if a vertex has a `position` and a `normal`
   * (both with three elements) it has a stride of 6 elements.
   */
  public readonly stride: number
  /**
   * Offset to the first attribute element from beginning of vertex
   *
   * @remarks
   * For example if a vertex consists of a `position` followed by a `normal`
   * (both with three elements)
   * the `position` has an offset of 0 and the `normal` an offset of 3
   */
  public readonly offset: number
  /**
   * Number of elements in a single attribute. e.g. a Vec3 has 3 elements
   */
  public readonly elements: number

  /**
   * The semantic name of this channel
   */
  public readonly name: string
  public readonly buffer: BufferOptions | Buffer

  private data: ArrayLike<number>

  constructor(
    buffer: BufferOptions | Buffer,
    name: string,
  ) {
    if (buffer instanceof Buffer) {
      this.data = Array.from(buffer.getData() as any)
    } else if (Array.isArray(buffer.data)) {
      this.data = buffer.data
    } else {
      throw new Error('not supported')
    }
    this.name = name
    this.buffer = buffer
    this.stride = VertexLayout.countElements(this.buffer.layout)
    this.offset = VertexLayout.countElementsBefore(this.buffer.layout, name)
    const attr = this.buffer.layout[name]
    this.elements = attr.packed ? 1 : attr.elements
  }

  /**
   * Reads a single element value of a vertex attribute.
   *
   * @param vIndex - The vertex index to read at
   * @param elementIndex - The element index to read. e.g. `0` is usually the `x` coordinate, `1` is `y` etc.
   */
  public read(vIndex: number, elementIndex: number): number {
    return this.data[this.stride * vIndex + this.offset + elementIndex]
  }

  /**
   * Reads a whole vertex attribute into the given target array
   *
   * @param vIndex - The vertex index to read at
   * @param target - The target array to read into
   * @param targetOffset - The offset in target array where to start writing
   */
  public readAttribute(vIndex: number, target: number[] = [], targetOffset: number = 0): number[] {
    const index = this.stride * vIndex + this.offset
    for (let j = 0; j < this.elements; j++) {
      target[targetOffset + j] = this.data[index + j]
    }
    return target
  }

  /**
   * Writes a single element value to a vertex attribute
   *
   * @param vIndex - The vertex index to write to
   * @param elementIndex - The element index to write. e.g. `0` is usually the `x` coordinate, `1` is `y` etc.
   * @param value - The value
   */
  public write(vIndex: number, elementIndex: number, value: number): void {
    this.data[this.stride * vIndex + this.offset + elementIndex] = value
  }

  /**
   * Writes a whole vertex attribute at given vertex index
   *
   * @param vIndex - The vertex index to write at
   * @param source - The attribute data to write
   * @param sourceOffset - The offset in source array where to start reading
   */
  public writeAttribute(vIndex: number, source: ReadonlyArray<number> = [], sourceOffset: number = 0) {
    const index = this.stride * vIndex + this.offset
    for (let j = 0; j < Math.min(this.elements, source.length - sourceOffset); j++) {
      this.data[index + j] = source[sourceOffset + j]
    }
  }

  /**
   * Reads a vertex attribute channel from start to end and emits each attribute
   *
   * @param emitter - The callback function
   * @param startVertex - The start vertex index where the scan begins
   * @param endVertex - The end vertex index where the scan ends
   */
  public forEach(
    emitter: (attr: number[], index: number) => void,
    startVertex: number = 0,
    endVertex: number = this.buffer instanceof Buffer ? this.buffer.elementCount : this.data.length / this.stride,
  ) {
    let data = this.data
    let vertex: number[] = []
    let index = this.offset + startVertex * this.stride
    for (let i = startVertex; i < endVertex; i++) {
      for (let j = 0; j < this.elements; j++) {
        vertex[j] = data[index + j]
      }
      emitter(vertex, i)
      index += this.stride
    }
  }

  public static fromVertexBuffer(vBuffers: Array<BufferOptions | Buffer>): ModelBuilderChannelMap {
    const channels = {}
    for (let buffer of vBuffers) {
      Object.keys(buffer.layout).forEach((name) => {
        channels[name] = new ModelBuilderChannel(buffer, name)
      })
    }
    return channels
  }
}
