import { BoundingBox, BoundingSphere } from '@gglib/math'
import { uuid } from '@gglib/utils'
import { Device } from '../Device'
import type { RenderEncoder } from '../RenderEncoder'
import type { PrimitiveType } from '../enums'
import { Buffer, VertexBuffer, type BufferOptions, type VertexBufferOptions } from '../resources'
import type { Disposable, Renderable } from '../types'

/**
 * Constructor options for {@link Geometry}
 *
 * @public
 */
export interface GeometryOptions {
  /**
   * A user defined name for the geometry
   */
  name?: string

  /**
   * Arbitrary user defined metadata attached to the geometry
   */
  meta?: Record<string, any>

  /**
   * An axis aligned bounding box containing the geometry in local space
   */
  boundingBox?: number[] | BoundingBox

  /**
   * A bounding sphere containing the geometry in local space
   */
  boundingSphere?: number[] | BoundingSphere

  /**
   * The mode of the geometry. e.g. TrinagleList, LineList etc.
   */
  primitiveType?: PrimitiveType

  /**
   * The index buffer
   */
  indexBuffer?: Buffer | BufferOptions

  /**
   * A single vertex buffer or an array ob vertex buffers
   */
  vertexBuffer?: VertexBuffer | VertexBufferOptions

  /**
   * Offset in index buffer
   */
  indexOffset?: number

  /**
   * Number of indices to render, if index buffer is used
   */
  indexCount?: number

  /**
   * Vertex offset to apply when rendering. Only applies when no index buffer is used.
   */
  vertexOffset?: number

  /**
   * The number of primitives to render
   */
  vertexCount?: number

  /**
   * The number of instances to render. Default is 1 (no instancing).
   */
  instanceCount?: number

  /**
   * WebGPU only. The instance offset to apply when rendering without index buffer.
   */
  instanceOffset?: number

  /**
   * WebGPU only. Base vertex to apply when rendering with index buffer. Default is 0.
   */
  baseVertex?: number
}

/**
 * @public
 */
export class Geometry implements Renderable, Disposable {
  /**
   * A unique id
   */
  public uid: string = uuid()

  /**
   * The graphics device
   */
  public readonly device: Device

  /**
   * A user defined name for the geometry
   */
  public name: string | null = null

  /**
   * Arbitrary user defined metadata attached to the geometry
   */
  public meta: Record<string, any> = {}

  /**
   * The axis aligned bounding box containing the mesh in local space
   */
  public boundingBox: BoundingBox | null

  /**
   * The bounding sphere containing the mesh in local space
   */
  public boundingSphere: BoundingSphere | null

  /**
   * The vertex buffer primitive type
   */
  public primitiveType: PrimitiveType

  /**
   * The index buffer
   */
  public indexBuffer: Buffer | null

  /**
   * Offset in index buffer
   */
  public indexOffset: number | null

  /**
   * Number of indices to render, if index buffer is used
   */
  public indexCount: number | null

  /**
   * The vertex buffers
   */
  public vertexBuffer: VertexBuffer

  /**
   * Vertex offset to apply when rendering. Only applies when no index buffer is used.
   */
  public vertexOffset: number

  /**
   * The number of primitives to render, if no index buffer is used
   */
  public vertexCount: number

  /**
   * The number of instances to render. Default is 1 (no instancing).
   */
  public instanceCount: number

  /**
   * WebGPU only. The instance offset to apply when rendering without index buffer.
   */
  public instanceOffset: number

  /**
   * WebGPU only. Base vertex to apply when rendering with index buffer. Default is 0.
   */
  public baseVertex: number

  constructor(device: Device, options: GeometryOptions) {
    this.device = device

    this.name = options.name
    this.meta = options.meta || {}

    if (options.boundingBox) {
      this.boundingBox = BoundingBox.convert(options.boundingBox)
    }
    if (options.boundingSphere) {
      this.boundingSphere = BoundingSphere.convert(options.boundingSphere)
    }

    this.indexBuffer?.dispose()
    if (options.indexBuffer instanceof Buffer) {
      this.indexBuffer = options.indexBuffer
    } else if (options.indexBuffer) {
      this.indexBuffer = this.device.createIndexBuffer(options.indexBuffer)
    } else {
      this.indexBuffer = null
    }

    this.vertexBuffer?.dispose()
    if (options.vertexBuffer instanceof VertexBuffer) {
      this.vertexBuffer = options.vertexBuffer
    } else if (options.vertexBuffer) {
      this.vertexBuffer = this.device.createVertexBuffer(options.vertexBuffer)
    } else {
      this.vertexBuffer = null
      throw new Error(`'vertexBuffer' option is missing`)
    }

    this.primitiveType = options.primitiveType || 'TriangleList'

    this.vertexCount = options.vertexCount ?? this.vertexBuffer.getMaxVertexCount()
    this.instanceCount = options.instanceCount ?? 1
    if (options.indexCount != null) {
      this.indexCount = options.indexCount
    } else if (this.indexBuffer) {
      this.indexCount = this.indexBuffer.elementCount
    } else {
      this.indexCount = null
    }

    this.baseVertex = options.baseVertex ?? 0
    this.indexOffset = options.indexOffset ?? 0
    this.vertexOffset = options.vertexOffset ?? 0
    this.instanceOffset = options.instanceOffset ?? 0
  }

  /**
   * Renders the geometry within the given render pass
   */
  public render(encoder: RenderEncoder): void {
    encoder.setIndexBuffer(this.indexBuffer)
    encoder.setVertexBuffer(this.vertexBuffer)
    encoder.setPrimitiveType(this.primitiveType)
    if (this.indexBuffer) {
      encoder.drawIndexed(this.indexCount, this.instanceCount, this.indexOffset, this.baseVertex)
    } else {
      encoder.draw(this.vertexCount, this.instanceCount, this.vertexOffset, this.instanceOffset)
    }
  }

  /**
   * Releases the index and vertex buffers
   */
  public dispose() {
    this.indexBuffer?.dispose()
    this.indexBuffer = null
    this.vertexBuffer?.dispose()
    this.vertexBuffer = null
  }
}
