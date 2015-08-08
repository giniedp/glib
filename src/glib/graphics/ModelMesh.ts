module Glib.Graphics {

  export interface ModelMeshOptions {
    boundingBox?: number[],
    boundingSphere?: number[],
    materialId?: number,
    indexBuffer?: Buffer|BufferOptions,
    vertexBuffer?: Buffer|BufferOptions
  }

  export class ModelMesh {
    device:Device;
    gl:any;
    boundingBox:number[];
    boundingSphere:number[];
    materialId:number = 0;
    indexBuffer:Buffer;
    vertexBuffer:Buffer;

    constructor(device:Device, params:ModelMeshOptions) {
      this.device = device;
      this.gl = device.context;
      this.boundingBox = params.boundingBox || [0, 0, 0, 0, 0, 0];
      this.boundingSphere = params.boundingSphere || [0, 0, 0, 0];
      this.materialId = Number(params.materialId) || 0;

      var buffer = params.indexBuffer || {};
      if (buffer instanceof Buffer) {
        this.indexBuffer = buffer;
      } else {
        buffer.type = BufferType.IndexBuffer;
        this.indexBuffer = new Buffer(device, buffer);
      }

      buffer = params.vertexBuffer || {};
      if (buffer instanceof Buffer) {
        this.vertexBuffer = buffer;
      } else {
        buffer.type = BufferType.VertexBuffer;
        this.vertexBuffer = new Buffer(device, buffer);
      }
    }

    draw(program:ShaderProgram):ModelMesh {
      var device = this.device;
      device.vertexBuffer = this.vertexBuffer;
      device.indexBuffer = this.indexBuffer;
      device.program = program;
      if (device.indexBuffer) {
        device.drawIndexedPrimitives();
      } else {
        device.drawPrimitives();
      }

      return this;
    }
  }
}