import { BoundingBox, BoundingSphere } from '@gglib/math'
import { uuid } from '@gglib/utils'
import { Device } from './Device'
import { PrimitiveType, PrimitiveTypeOption, valueOfPrimitiveType } from './enums'
import { Buffer, BufferOptions } from './resources/Buffer'
import { ShaderProgram } from './resources/ShaderProgram'

/**
 * Constructor options for {@link ModelMesh}
 *
 * @public
 */
export interface ModelMeshOptions {
  /**
   * A user defined name of the mesh object
   */
  name?: string
  /**
   * An axis aligned bounding box containing the mesh in local space
   */
  boundingBox?: number[] | BoundingBox
  /**
   * A bounding sphere containing the mesh in local space
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
  vertexBuffer?: Buffer | BufferOptions | Array<Buffer | BufferOptions>
  /**
   * Offset in vertex buffer
   */
  vertexOffset?: number
  /**
   * The mode of the mesh. e.g. TrinagleList, LineList etc.
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
export class ModelMesh {
  public static readonly Options = Symbol('ModelMeshOptions')

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
  public vertexBuffer: Buffer[]
  /**
   * The vertex buffer primitive type
   */
  public primitiveType: number

  constructor(device: Device, params: ModelMeshOptions) {
    this.device = device

    this.materialId = params.materialId || 0
    this.boundingBox = BoundingBox.convert(params.boundingBox)
    this.boundingSphere = BoundingSphere.convert(params.boundingSphere)
    this.primitiveType = valueOfPrimitiveType(params.primitiveType) || PrimitiveType.TriangleList

    if (params.indexBuffer instanceof Buffer) {
      this.indexBuffer = params.indexBuffer
    } else if (params.indexBuffer) {
      this.indexBuffer = device.createIndexBuffer(params.indexBuffer)
    } else {
      // no index buffer given
      // the geometry will be rendered using the gl.drawArrays() method
    }

    if (!params.vertexBuffer) {
      throw new Error(`'vertexBuffer' option is missing`)
    }
    const vBuffers = Array.isArray(params.vertexBuffer)
      ? params.vertexBuffer
      : [params.vertexBuffer]

    this.vertexBuffer = vBuffers.map((buffer) => {
      return buffer instanceof Buffer ? buffer : device.createVertexBuffer(buffer)
    })
  }

  /**
   * Draws the mesh with the given program
   *
   * @param program - the program to draw with
   */
  public draw(program: ShaderProgram): ModelMesh {
    const device = this.device
    device.vertexBuffers = this.vertexBuffer
    device.indexBuffer = this.indexBuffer
    device.program = program
    try {
      if (device.indexBuffer) {
        device.drawIndexedPrimitives(this.primitiveType)
      } else {
        device.drawPrimitives(this.primitiveType)
      }
    } finally {
      device.vertexBuffers = null
    }

    return this
  }

  public destroy() {
    this.indexBuffer.destroy()
    this.vertexBuffer.forEach((it) => it.destroy())
  }
}
