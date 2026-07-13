import { ArrayLike } from '@gglib/math'
import { Buffer, BufferOptions, isPlainBufferData, PlainBufferData } from '../resources'
import { countElements, countElementsBefore, elementCpuFormat } from '../VertexLayout'

/**
 * @public
 */
export type GeometryBuilderChannelMap = Record<string, GeometryBuilderChannel>

/**
 * @public
 */
export class GeometryBuilderChannel {
  /**
   * Total number of elements in a vertex
   *
   * @remarks
   * For example if a vertex has a `position` and a `normal`
   * (both with three elements) it has a stride of 6 elements.
   */
  public readonly elementStride: number

  /**
   * Offset in number of elements from beginning of vertex
   *
   * @remarks
   * For example if a vertex consists of a `position` followed by a `normal`
   * (both with three elements)
   * the `position` has an offset of 0 and the `normal` an offset of 3
   */
  public readonly elementOffset: number

  /**
   * Number of elements in a single attribute. e.g. a Vec3 has 3 elements
   */
  public readonly elementCount: number

  /**
   * The semantic name of this channel
   */
  public readonly name: string

  /**
   * The buffer to operate on
   */
  public readonly buffer: BufferOptions

  /**
   * Returns the number of attributes
   */
  public get count() {
    return this.data.length / this.elementStride
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
    const vertexLayout = buffer.vertexLayout
    if (!vertexLayout) {
      throw new Error('missing vertexLayout on buffer')
    }
    const channelLayout = vertexLayout?.[name]
    if (!channelLayout) {
      throw new Error('missing channelLayout on buffer')
    }

    this.name = name
    this.buffer = buffer
    this.elementStride = countElements(this.buffer.vertexLayout, 'cpu')
    this.elementOffset = countElementsBefore(this.buffer.vertexLayout, name)
    this.elementCount = elementCpuFormat(channelLayout).elementCount
  }

  /**
   * Reads a single element value of a vertex attribute.
   *
   * @param vIndex - The vertex index to read at
   * @param elementIndex - The element index to read. e.g. `0` is usually the `x` coordinate, `1` is `y` etc.
   */
  public read(vIndex: number, elementIndex: number): number {
    return this.data[this.elementStride * vIndex + this.elementOffset + elementIndex]
  }

  /**
   * Reads a whole vertex attribute into the given target array
   *
   * @param vIndex - The vertex index to read at
   * @param target - The target array to read into
   * @param targetOffset - The offset in target array where to start writing
   */
  public readAttribute(vIndex: number, target: number[] = [], targetOffset: number = 0): number[] {
    const index = this.elementStride * vIndex + this.elementOffset
    for (let j = 0; j < this.elementCount; j++) {
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
    this.data[this.elementStride * vIndex + this.elementOffset + elementIndex] = value
  }

  /**
   * Writes a whole vertex attribute at given vertex index
   *
   * @param vIndex - The vertex index to write at
   * @param source - The attribute data to write
   * @param sourceOffset - The offset in source array where to start reading
   */
  public writeAttribute(vIndex: number, source: ReadonlyArray<number>, sourceOffset: number = 0) {
    const index = this.elementStride * vIndex + this.elementOffset
    for (let j = 0; j < Math.min(this.elementCount, source.length - sourceOffset); j++) {
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
    endVertex: number = this.buffer instanceof Buffer
      ? this.buffer.elementCount
      : this.data.length / this.elementStride,
  ) {
    let data = this.data
    let vertex: number[] = []
    let index = this.elementOffset + startVertex * this.elementStride
    for (let i = startVertex; i < endVertex; i++) {
      for (let j = 0; j < this.elementCount; j++) {
        vertex[j] = data[index + j]
      }
      emitter(vertex, i)
      index += this.elementStride
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
