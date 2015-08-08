module Glib.Graphics {

  export interface ModelOptions {
    boundingBox?: number[];
    boundingSphere?: number[];
    materials?: Material[];
    meshes?: ModelMesh[];
  }

  export class Model {
    device:Device;
    gl:any;
    boundingBox:number[];
    boundingSphere:number[];
    materials:Material[] = [];
    meshes:ModelMesh[] = [];

    constructor(device:Device, params:ModelOptions) {
      this.device = device;
      this.gl = device.context;
      this.boundingBox = params.boundingBox || [0, 0, 0, 0, 0, 0];
      this.boundingSphere = params.boundingSphere || [0, 0, 0, 0];

      var meshes = params.meshes || [];
      for (var mesh of meshes) {
        if (mesh instanceof ModelMesh) {
          this.meshes.push(mesh);
        } else {
          this.meshes.push(new ModelMesh(this.device, mesh));
        }
      }

      var materials = params.materials || [];
      for (var material of materials) {
        if (material instanceof Material) {
          this.materials.push(material);
        } else {
          this.materials.push(new Material(this.device, material));
        }
      }
    }

    draw():Model {
      var i, j, mesh, meshes = this.meshes, material, materials = this.materials, pass;
      for (i = 0; i < meshes.length; i += 1) {
        mesh = meshes[i];
        material = materials[mesh.material || 0];
        for (j = 0; j < material.passes.length; j += 1) {
          pass = material.passes[i];
          pass.commit(material.parameters);
          mesh.draw(pass);
        }
      }
      return this;
    }
  }
}