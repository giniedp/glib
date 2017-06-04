import { flattenArray, isString, uuid } from '@glib/core'
import { Device } from './Device'
import { ModelMesh, ModelMeshOptions } from './ModelMesh'
import { ShaderEffect, ShaderEffectOptions } from './ShaderEffect'

export interface ModelOptions {
  name?: string
  boundingBox?: number[]
  boundingSphere?: number[]
  materials?: ShaderEffect[]|ShaderEffectOptions[]
  meshes?: ModelMesh[]|ModelMeshOptions[]
}

export class Model {
  public uid: string
  public device: Device
  public gl: any
  public boundingBox: number[]
  public boundingSphere: number[]
  public materials: ShaderEffect[] = []
  public meshes: ModelMesh[] = []

  constructor(device: Device, params: ModelOptions) {
    this.uid = uuid()
    this.device = device
    this.gl = device.context
    this.boundingBox = params.boundingBox || [0, 0, 0, 0, 0, 0]
    this.boundingSphere = params.boundingSphere || [0, 0, 0, 0]

    let meshes = [].concat.apply([], params.meshes || [])
    for (let mesh of meshes) {
      if (mesh instanceof ModelMesh) {
        this.meshes.push(mesh)
      } else {
        this.meshes.push(new ModelMesh(this.device, mesh))
      }
    }

    const materials = flattenArray(params.materials)
    for (let material of materials) {
      if (material instanceof ShaderEffect) {
        this.materials.push(material)
      } else {
        this.materials.push(new ShaderEffect(this.device, material))
      }
    }

    // convert materialIds from string name to numeric index
    for (const meshItem of this.meshes) {
      let index = 0
      const name = meshItem.materialId
      if (!isString(name)) { continue }
      for (const materialItem of materials) {
        if (materialItem.name === name) {
          meshItem.materialId = index
          break
        }
        index += 1
      }
    }
  }

  public draw(): Model {
    for (const mesh of this.meshes) {
      const material: ShaderEffect = this.materials[mesh.materialId] || this.materials[0]
      if (!material) { continue }
      const technique = material.technique
      if (!technique) { continue }
      for (const pass of technique.passes) {
        pass.commit(material.parameters) // TODO:
        mesh.draw(pass.program)
      }
    }
    return this
  }
}
