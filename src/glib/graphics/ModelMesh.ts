module Glib.Graphics {

  export interface ModelMeshOptions {
    boundingBox?: number[],
    boundingSphere?: number[],
    materialId?: number|string,
    indexBuffer?: Buffer|BufferOptions,
    vertexBuffer?: Buffer|BufferOptions
  }

  export class ModelMesh {
    device:Device;
    gl:any;
    boundingBox:BoundingBox;
    boundingSphere:BoundingSphere;
    materialId:number|string = 0;
    indexBuffer:Buffer;
    vertexBuffer:Buffer;

    constructor(device:Device, params:ModelMeshOptions) {
      this.device = device;
      this.gl = device.context;

      this.materialId = params.materialId || 0;

      var box:any = params.boundingBox;
      if (box instanceof BoundingBox) {
        this.boundingBox = box
      } else if (Array.isArray(box)) {
        this.boundingBox = new Glib.BoundingBox({ x:box[0], y:box[1], z:box[2] }, { x:box[3], y:box[4], z:box[5] });
      } else {
        this.boundingBox = new BoundingBox();
      }
      
      var sphere:any = params.boundingSphere;
      if (sphere instanceof BoundingSphere) {
        this.boundingSphere = sphere;
      } else if (Array.isArray(sphere)) {
        this.boundingSphere = new Glib.BoundingSphere({ x:sphere[0], y:sphere[1], z:sphere[2] }, sphere[3]);
      } else {
        this.boundingSphere = new BoundingSphere();
      }
      
      var buffer:any = params.indexBuffer || {};
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
