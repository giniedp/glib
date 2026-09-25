import type { Device } from '../Device'
import {
  BufferUsage,
  type DataType,
  dataTypeToArrayType,
  dataTypeToSize,
  dataTypeViewWriter,
  type TypedArray,
  vertexTypeFormat,
} from '../enums'
import {
  countElements,
  countElementsBefore,
  elementCpuFormat,
  type VertexLayout,
  vertexLayoutSize,
} from './VertexLayout'

/**
 * Constructor options for {@link Buffer}
 *
 * @public
 */
export interface BufferOptions<T = TypedArray | ArrayBuffer | PlainBufferData> {
  /**
   *
   */
  name?: string

  /**
   * Indicates buffer usage e.g. `VertexBuffer` or `IndexBuffer`
   */
  usage?: number

  /**
   * The element type of index buffer. Usable only for index buffers.
   */
  indexType?: Extract<DataType, 'uint16' | 'uint32'>

  /**
   * The VertexBuffer layout. Usable only for vertex buffers
   */
  layout?: VertexLayout

  /**
   * The actual data to set on the buffer.
   */
  data?: T

  /**
   * Size in bytes of a single element in the buffer
   *
   * @remarks
   * - For VertexBuffer this is the size in bytes of a whole vertex.
   * - For IndexBuffer this is the size in bytes of a single index element.
   */
  stride?: number

  /**
   * The total size of the buffer in bytes. If not provided, it will be inferred from the data length and data type.
   */
  size?: number

  /**
   * The total number of valid elements in this buffer.
   *
   * @remarks
   * - For VertexBuffer this is the count of all vertices.
   * - For IndexBuffer this is the count of all indices.
   */
  elementCount?: number

  /**
   * Indicates whether this buffer is used for instanced rendering (vertex buffer with divisor > 0)
   */
  instanced?: boolean

  /**
   * WebGPU only. Indicates whether this is a StorageBuffer that can be read and written in shaders. Ignored in WebGL.
   */
  readWrite?: boolean
}

/**
 * @public
 */
export abstract class Buffer {
  public abstract readonly device: Device

  /**
   *
   */
  public readonly name: string

  /**
   * Indicates buffer usage e.g. VertexBuffer or IndexBuffer
   */
  public readonly usage: number

  /**
   * The size of the data in bytes
   */
  public readonly size: number

  /**
   * Size in bytes of a single element in the buffer
   *
   * @remarks
   * - For VertexBuffer this is the size in bytes of a whole vertex.
   * - For IndexBuffer this is the size in bytes of a single index value.
   */
  public readonly stride: number

  /**
   * Indicates whether this buffer is used for instanced rendering (vertex buffer with divisor > 0)
   */
  public readonly instanced: boolean

  /**
   * The total number of elements in this buffer
   *
   * @remarks
   * - For VertexBuffer this is the count of all vertices.
   * - For IndexBuffer this is the count of all indices.
   */
  public readonly elementCount: number

  /**
   *
   */
  public readonly vertexLayout: VertexLayout

  /**
   *
   */
  public readonly indexType: Extract<DataType, 'uint16' | 'uint32'>

  /**
   * Indicates whether this is an IndexBuffer
   */
  public get isIndexBuffer(): boolean {
    return !!(this.usage & BufferUsage.INDEX)
  }

  /**
   * Indicates whether this is a VertexBuffer
   */
  public get isVertexBuffer(): boolean {
    return !!(this.usage & BufferUsage.VERTEX)
  }

  /**
   * Indicates whether this is a UniformBuffer
   */
  public get isUniformBuffer(): boolean {
    return !!(this.usage & BufferUsage.UNIFORM)
  }

  /**
   * WebGPU only. Indicates whether this is a StorageBuffer
   */
  public get isStorageBuffer(): boolean {
    return !!(this.usage & BufferUsage.STORAGE)
  }
  /**
   * Resets the buffer to the given options
   */
  public reset(opts: BufferOptions): void {
    const self = this as Mutable<this>
    self.name = opts.name ?? self.name
    self.usage = opts.usage ?? self.usage
    self.instanced = !!opts.instanced
    self.indexType = opts.indexType ?? self.indexType

    if (!self.usage) {
      throw new Error(`missing 'usage' option`)
    }

    if (opts.layout) {
      self.vertexLayout = opts.layout
    } else if (self.isVertexBuffer) {
      throw new Error(`missing 'layout' option for VertexBuffer`)
    } else {
      self.vertexLayout = {}
    }

    if (opts.stride != null) {
      self.stride = opts.stride
    } else if (self.isVertexBuffer) {
      self.stride = vertexLayoutSize(self.vertexLayout)
    } else if (self.isIndexBuffer) {
      self.stride = dataTypeToSize(self.indexType)
    } else {
      self.stride = 1
    }

    self.size = opts.size ?? 0
    self.elementCount = self.size / self.stride

    self.create()
    if (opts.data) {
      self.setData(opts.data)
    }
  }

  public abstract create(): void

  public abstract dispose(): void

  /**
   * Sets the buffer data to exactly the given data (portion).
   * The buffer will be re-created if the given data size differs from the current buffer size.
   *
   * @param src - The source data to set on the buffer
   * @param srcOffset - Offset in {@link src} where data starts. Given in elements if {@link src} is a TypedArray, in bytes otherwise. Defaults to 0.
   * @param srcLength - The length of the data to set. Given in elements if {@link src} is a TypedArray, in bytes otherwise. Defaults to the rest of the src after srcOffset.
   */
  public abstract setData(src: TypedArray | ArrayBuffer | PlainBufferData, srcOffset?: number, srcLength?: number): void

  /**
   * Sets a sub-region of the buffer to the given data.
   * Buffer is expected to be already created and large enough to fit the given data at the given offset.
   *
   * @param byteOffset - The byte offset in the buffer where the data should be placed
   * @param src - The source data to set on the buffer
   * @param srcOffset - Offset in {@link src} where data starts. Given in elements if {@link src} is a TypedArray, in bytes otherwise. Defaults to 0.
   * @param srcLength - The length of the data to set. Given in elements if {@link src} is a TypedArray, in bytes otherwise. Defaults to the rest of the src after srcOffset.
   */
  public abstract setSubData(
    byteOffset: number,
    src: TypedArray | ArrayBuffer,
    srcOffset?: number,
    srcLength?: number,
  ): void

  public findLayout(nameOrSemantic: string) {
    let result = this.vertexLayout[nameOrSemantic]
    if (result) {
      return result
    }
    nameOrSemantic = nameOrSemantic.toLowerCase()
    for (const key in this.vertexLayout) {
      if (nameOrSemantic.endsWith(key)) {
        return this.vertexLayout[key]
      }
    }
    return null
  }
}

type Mutable<T> = {
  -readonly [K in keyof T]: T[K]
}

export type PlainBufferData = {
  type: DataType
  elements: number[]
}

export function isPlainBufferData(data: any): data is PlainBufferData {
  return data && typeof data === 'object' && 'type' in data && 'elements' in data
}

export function materializePlainBuffer(src: PlainBufferData, layout?: VertexLayout) {
  let elementTypesMatch = true

  if (layout) {
    for (const key in layout) {
      const type = layout[key].cpu || layout[key].type
      const vertex = vertexTypeFormat(type)
      if (src.type !== vertex.elementType) {
        elementTypesMatch = false
        break
      }
    }
  }

  if (elementTypesMatch) {
    const ArrayType = dataTypeToArrayType(src.type)
    return new ArrayType(src.elements)
  }

  const elementStride = countElements(layout, 'cpu')
  if (src.elements.length % elementStride != 0) {
    throw new Error(`source data does not match the given layout`)
  }

  const vertexCount = src.elements.length / elementStride
  const byteStride = vertexLayoutSize(layout)
  const data = new Uint8Array(vertexCount * byteStride)
  const view = new DataView(data.buffer)
  const elementOffsets: Record<string, number> = {}
  for (const channel in layout) {
    elementOffsets[channel] = countElementsBefore(layout, channel)
  }

  let byteOffset = 0
  let elementOffset = 0
  for (let i = 0; i < vertexCount; i++) {
    for (const channel in layout) {
      const off = elementOffsets[channel]
      const cpu = elementCpuFormat(layout[channel])
      const writer = dataTypeViewWriter(cpu.elementType)
      const size = dataTypeToSize(cpu.elementType)
      for (let j = off; j < off + cpu.elementCount; j++) {
        writer(view, byteOffset + j * size, src.elements[elementOffset + j])
      }
    }
    byteOffset += byteStride
    elementOffset += elementStride
  }
  return data
}
