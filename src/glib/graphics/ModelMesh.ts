module Glib.Graphics {

  export interface ModelMeshOptions {
    name?:string,
    boundingBox?: number[]|BoundingBox,
    boundingSphere?: number[]|BoundingSphere,
    materialId?: number|string,
    indexBuffer?: Buffer|BufferOptions,
    vertexBuffer?: Buffer|BufferOptions
  }

  export class ModelMesh {
    uid:string
    device:Device
    gl:any
    boundingBox:BoundingBox
    boundingSphere:BoundingSphere
    materialId: number|string = 0
    indexBuffer:Buffer
    vertexBuffer:Buffer

    constructor(device:Device, params:ModelMeshOptions) {
      this.uid = utils.uuid()
      this.device = device
      this.gl = device.context

      this.materialId = params.materialId || 0
      this.boundingBox = BoundingBox.convert(params.boundingBox)
      this.boundingSphere = BoundingSphere.convert(params.boundingSphere)
      
      let buffer:any = params.indexBuffer || {}
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

    draw(program:ShaderProgram):ModelMesh {
      let device = this.device
      device.vertexBuffer = this.vertexBuffer
      device.indexBuffer = this.indexBuffer
      device.program = program
      if (device.indexBuffer) {
        device.drawIndexedPrimitives()
      } else {
        device.drawPrimitives()
      }

      return this;
    }
  }
}
