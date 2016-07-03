module Glib.Graphics {

  export interface ModelOptions {
    name?:string;
    boundingBox?: number[];
    boundingSphere?: number[];
    materials?: Material[]|MaterialOptions[];
    meshes?: ModelMesh[]|ModelMeshOptions[];
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

      var meshes = [].concat.apply([], params.meshes || []);
      for (var mesh of meshes) {
        if (mesh instanceof ModelMesh) {
          this.meshes.push(mesh);
        } else {
          this.meshes.push(new ModelMesh(this.device, mesh));
        }
      }

      var materials = [].concat.apply([], params.materials || []);
      for (var material of materials) {
        if (material instanceof Material) {
          this.materials.push(material);
        } else {
          this.materials.push(new Material(this.device, material));
        }
      }

      // convert materialIds from string name to numeric index
      for (var meshItem of this.meshes) {
        var index = 0;
        var name = meshItem.materialId;
        if (typeof name === "string") {
          for (var materialItem of materials) {
            if (materialItem.name === name) {
              meshItem.materialId = index;
              break;
            }
            index += 1;
          }
        }
      }
    }

    draw():Model {
      for (var mesh of this.meshes) {
        var material = this.materials[mesh.materialId];
        if (!material) continue;
        var technique = material.technique;
        if (!technique) continue;
        for (var pass of technique.passes) {
          pass.commit();
          mesh.draw(pass.program);
        }
      }
      return this;
    }
  }
}
