import { ArrayLike } from '@gglib/math'
import { Buffer, BufferOptions, isPlainBufferData, PlainBufferData } from '../resources'
import { countElements, countElementsBefore } from '../VertexLayout'

/**
 * @public
 */
export type GeometryBuilderChannelMap = Record<string, GeometryBuilderChannel>

/**
 * @public
 */
export class GeometryBuilderChannel {
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

  public readonly packed: boolean

  /**
   * The semantic name of this channel
   */
  public readonly name: string
  public readonly buffer: BufferOptions

  /**
   * Returns the number of attributes
   */
  public get count() {
    return this.data.length / this.stride
  }

  private data: ArrayLike<number>

  constructor(buffer: BufferOptions, name: string) {
    if (!name) {
      throw new Error('"name" must not be empty')
    }
    if (buffer instanceof Buffer) {
      throw new Error('Buffer instances are not supported yet')
    }
    if (!buffer.data) {
      throw new Error('buffer data is required')
    }
    if (isPlainBufferData(buffer.data)) {
      this.data = buffer.data.elements
    } else if (Array.isArray(buffer.data) || ArrayBuffer.isView(buffer.data)) {
      this.data = buffer.data as any
    } else {
      throw new Error(`unsupported buffer data type: ${typeof buffer.data}`)
    }
    this.name = name
    this.buffer = buffer
    this.stride = countElements(this.buffer.vertexLayout)
    this.offset = countElementsBefore(this.buffer.vertexLayout, name)
    const attr = this.buffer.vertexLayout[name]
    this.packed = !!attr.packed
    if (attr.packed) {
      this.elements = 1
    } else {
      this.elements = attr.elementCount
    }
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
  public writeAttribute(vIndex: number, source: ReadonlyArray<number>, sourceOffset: number = 0) {
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

  public static fromVertexBuffer(vBuffers: Array<BufferOptions<PlainBufferData>>): GeometryBuilderChannelMap {
    const channels = {}
    for (let buffer of vBuffers) {
      Object.keys(buffer.vertexLayout).forEach((name) => {
        channels[name] = new GeometryBuilderChannel(buffer, name)
      })
    }
    return channels
  }
}
