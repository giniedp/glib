import { uuid } from '@glib/core'
import { BoundingBox, BoundingSphere } from '@glib/math'
import { Buffer, BufferOptions } from './Buffer'
import { Device } from './Device'
import { PrimitiveType, PrimitiveTypeOption } from './enums'
import { ShaderProgram } from './ShaderProgram'

export interface ModelMeshOptions {
  name?: string
  boundingBox?: number[]|BoundingBox
  boundingSphere?: number[]|BoundingSphere
  materialId?: number|string
  indexBuffer?: Buffer|BufferOptions
  vertexBuffer?: Buffer|BufferOptions
  primitiveType?: PrimitiveTypeOption,
}

export class ModelMesh {
  public uid: string
  public device: Device
  public gl: any
  public boundingBox: BoundingBox
  public boundingSphere: BoundingSphere
  public materialId: number|string = 0
  public indexBuffer: Buffer
  public vertexBuffer: Buffer
  public primitiveType: number

  constructor(device: Device, params: ModelMeshOptions) {
    this.uid = uuid()
    this.device = device
    this.gl = device.context

    this.materialId = params.materialId || 0
    this.boundingBox = BoundingBox.convert(params.boundingBox)
    this.boundingSphere = BoundingSphere.convert(params.boundingSphere)
    this.primitiveType = PrimitiveType[params.primitiveType] || PrimitiveType.TriangleList

    let buffer: any = params.indexBuffer || {}
    if (buffer instanceof Buffer) {
      this.indexBuffer = buffer
    } else {
      this.indexBuffer = device.createIndexBuffer(buffer)
    }

    buffer = params.vertexBuffer || {}
    if (buffer instanceof Buffer) {
      this.vertexBuffer = buffer
    } else {
      this.vertexBuffer = device.createVertexBuffer(buffer)
    }
  }

  public draw(program: ShaderProgram): ModelMesh {
    let device = this.device
    device.vertexBuffer = this.vertexBuffer
    device.indexBuffer = this.indexBuffer
    device.program = program
    if (device.indexBuffer) {
      device.drawIndexedPrimitives(this.primitiveType)
    } else {
      device.drawPrimitives(this.primitiveType)
    }

    return this
  }
}
