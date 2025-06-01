import { BoundingBox, BoundingSphere } from '@gglib/math'
import { uuid } from '@gglib/utils'

import { Device } from '../Device'
import { PrimitiveType, PrimitiveTypeOption, valueOfPrimitiveType } from '../enums'
import { Buffer, BufferOptions } from '../resources/Buffer'
import { ShaderProgram } from '../resources/ShaderProgram'
import { VertexBuffer, VertexBufferOptions } from '../resources/VertexBuffer'

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
   * An axis aligned bounding box containing the geometry in local space
   */
  boundingBox?: number[] | BoundingBox

  /**
   * A bounding sphere containing the geometry in local space
   */
  boundingSphere?: number[] | BoundingSphere

  /**
   * The material identifier. Defaults to 0
   */
  materialId?: number | string

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
   * The mode of the geometry. e.g. TrinagleList, LineList etc.
   */
  primitiveType?: PrimitiveTypeOption

  /**
   * Number of primitives to render
   */
  primitiveCount?: number
}

/**
 * @public
 */
export class Geometry {
  public static readonly Options = Symbol('GeometryOptions')

  /**
   * A unique id
   */
  public uid: string = uuid()

  /**
   * The graphics device
   */
  public readonly device: Device

  /**
   * The axis aligned bounding box containing the mesh in local space
   */
  public boundingBox: BoundingBox

  /**
   * The bounding sphere containing the mesh in local space
   */
  public boundingSphere: BoundingSphere

  /**
   * The material id or name referencing the material in the models material collection
   *
   * @remarks
   * usually used as index into the material list of the mesh that owns this geometry.
   */
  public materialId: number | string = 0

  /**
   * The index buffer
   */
  public indexBuffer: Buffer

  /**
   * Offset in index buffer
   */
  public indexOffset: number | null

  /**
   * The vertex buffers
   */
  public vertexBuffer: VertexBuffer

  /**
   * The vertex buffer primitive type
   */
  public primitiveType: number

  /**
   * The number of primitives to render
   */
  public primitiveCount: number | null

  constructor(device: Device, options: GeometryOptions) {
    this.device = device
    this.reset(options)
  }

  public reset(options: GeometryOptions) {
    this.materialId = options.materialId ?? this.materialId
    if (options.boundingBox) {
      this.boundingBox = BoundingBox.convert(options.boundingBox)
    }
    if (options.boundingSphere) {
      this.boundingSphere = BoundingSphere.convert(options.boundingSphere)
    }
    if (options.primitiveType) {
      this.primitiveType = valueOfPrimitiveType(options.primitiveType) || PrimitiveType.TriangleList
    }
    if (options.indexOffset !== undefined) {
      this.indexOffset = options.indexOffset || null
    }
    if (options.primitiveCount !== undefined) {
      this.primitiveCount = options.primitiveCount || null
    }

    this.indexBuffer?.dispose()
    this.indexBuffer = null
    if (options.indexBuffer instanceof Buffer) {
      this.indexBuffer = options.indexBuffer
    } else if (options.indexBuffer) {
      this.indexBuffer = this.device.createIndexBuffer(options.indexBuffer)
    } else {
      // no index buffer given
      // the geometry will be rendered using the gl.drawArrays() method
    }

    this.vertexBuffer?.dispose()
    this.vertexBuffer = null
    if (options.vertexBuffer instanceof VertexBuffer) {
      this.vertexBuffer = options.vertexBuffer
    } else if (options.vertexBuffer) {
      this.vertexBuffer = this.device.createVertexBuffer(options.vertexBuffer)
    } else {
      throw new Error(`'vertexBuffer' option is missing`)
    }
  }

  /**
   * Draws the geometry with the given program
   */
  public draw(program: ShaderProgram): Geometry {
    const device = this.device
    device.vertexBuffer = this.vertexBuffer
    device.indexBuffer = this.indexBuffer
    device.program = program
    try {
      if (device.indexBuffer) {
        device.drawIndexedPrimitives(this.primitiveType, this.indexOffset, this.primitiveCount)
      } else {
        device.drawPrimitives(this.primitiveType, this.indexOffset, this.primitiveCount)
      }
    } catch (e) {
      console.error(e)
      // TODO: disable the geometry from further rendering?
    }

    return this
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
