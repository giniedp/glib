module Glib.Graphics {

  export interface ModelOptions {
    name?:string
    boundingBox?: number[]
    boundingSphere?: number[]
    materials?: ShaderMaterial[]|ShaderMaterialOptions[]
    meshes?: ModelMesh[]|ModelMeshOptions[]
  }

  export class Model {
    uid:string
    device:Device
    gl:any
    boundingBox:number[]
    boundingSphere:number[]
    materials:ShaderMaterial[] = []
    meshes:ModelMesh[] = []

    constructor(device:Device, params:ModelOptions) {
      this.uid = utils.uuid()
      this.device = device
      this.gl = device.context
      this.boundingBox = params.boundingBox || [0, 0, 0, 0, 0, 0]
      this.boundingSphere = params.boundingSphere || [0, 0, 0, 0]

      let meshes = [].concat.apply([], params.meshes || [])
      for (let mesh of meshes) {
        if (mesh instanceof ModelMesh) {
          this.meshes.push(mesh);
        } else {
          this.meshes.push(new ModelMesh(this.device, mesh));
        }
      }

      let materials = [].concat.apply([], params.materials || [])
      for (let material of materials) {
        if (material instanceof ShaderMaterial) {
          this.materials.push(material);
        } else {
          this.materials.push(new ShaderMaterial(this.device, material));
        }
      }

      // convert materialIds from string name to numeric index
      for (let meshItem of this.meshes) {
        let index = 0;
        let name = meshItem.materialId;
        if (typeof name === "string") {
          for (let materialItem of materials) {
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
      for (let mesh of this.meshes) {
        let material = this.materials[mesh.materialId]
        if (!material) continue
        let technique = material.technique
        if (!technique) continue
        for (let pass of technique.passes) {
          pass.commit()
          mesh.draw(pass.program)
        }
      }
      return this;
    }
  }
}
