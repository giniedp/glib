import { flattenArray, isString, uuid } from '@gglib/core'
import { Mat4 } from '@gglib/math'
import { AnimationTake } from './AnimationPlayer'
import { Device } from './Device'
import { ModelMesh, ModelMeshOptions } from './ModelMesh'
import { ShaderEffect, ShaderEffectOptions } from './ShaderEffect'

export interface ModelOptions {
  name?: string
  boundingBox?: number[]
  boundingSphere?: number[]
  materials?: ShaderEffect[]|ShaderEffectOptions[]
  meshes?: ModelMesh[]|ModelMeshOptions[]
  skeleton?: number[]
  pose?: Array<Mat4|number[]>
  takes?: AnimationTake[]
}

export class Model {
  /**
   * Autmatically generated unique identifier
   */
  public uid: string
  /**
   * The graphics device
   */
  public device: Device
  /**
   * The GL handler
   */
  public gl: any
  /**
   * The models local bounding box
   */
  public boundingBox: number[]
  /**
   * The models local bounign sphere
   */
  public boundingSphere: number[]
  /**
   * Collection of materials that are used by the model meshes
   */
  public materials: ShaderEffect[] = []
  /**
   * Collection of meshes
   */
  public meshes: ModelMesh[] = []
  /**
   * The skeleton bone hierarchy
   */
  public skeleton: number[]
  /**
   * The binding pose
   */
  public pose: Mat4[]
  /**
   * Collection of all animation takes for this model
   */
  public takes: AnimationTake[]

  constructor(device: Device, options: ModelOptions) {
    this.uid = uuid()
    this.device = device
    this.gl = device.context
    this.boundingBox = options.boundingBox || [0, 0, 0, 0, 0, 0]
    this.boundingSphere = options.boundingSphere || [0, 0, 0, 0]
    this.takes = options.takes
    this.skeleton = options.skeleton

    const pose = options.pose
    if (pose != null) {
      this.pose = pose.map((it) => {
        if (it instanceof Mat4) {
          return it
        }
        return new Mat4(new Float32Array(it))
      })
    }

    const meshes = [].concat.apply([], options.meshes || [])
    for (let mesh of meshes) {
      if (mesh instanceof ModelMesh) {
        this.meshes.push(mesh)
      } else {
        this.meshes.push(new ModelMesh(this.device, mesh))
      }
    }

    const materials = flattenArray(options.materials)
    for (const material of materials) {
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
