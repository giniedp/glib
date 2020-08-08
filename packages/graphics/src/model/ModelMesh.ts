import { BoundingBox, BoundingSphere } from '@gglib/math'
import { isString, uuid, TypeToken, Log } from '@gglib/utils'

import { ModelMeshPart, ModelMeshPartOptions } from './ModelMeshPart'

import { Device } from '../Device'
import { Material, MaterialOptions } from '../Material'

/**
 * @public
 */
export interface ModelMeshOptions {
  /**
   * The identifying name of the mesh
   */
  name?: string
  /**
   * The axis aligned bounding box containing all mesh parts
   */
  boundingBox?: number[] | BoundingBox
  /**
   * The bounding sphere containing all mesh parts
   */
  boundingSphere?: number[] | BoundingSphere
  /**
   * Collection of materials that are used by the mesh
   */
  materials?: Array<Material | MaterialOptions>
  /**
   * Collection of mesh parts
   */
  parts?: Array<ModelMeshPart | ModelMeshPartOptions>
}

/**
 * @public
 */
export class ModelMesh {
  /**
   * A symbol identifying the `ModelMesh[]` type.
   */
  public static readonly Array = new TypeToken<ModelMesh[]>('ModelMesh[]', { factory: () => ([])})
  /**
   * A symbol identifying the `ModelMeshOptions` type.
   */
  public static readonly Options = new TypeToken<ModelMeshOptions>('ModelMeshOptions', { factory: () => ({})})
  /**
   * A symbol identifying the `ModelMeshOptions[]` type.
   */
  public static readonly OptionsArray = new TypeToken<ModelMeshOptions[]>('ModelMeshOptions[]', { factory: () => ([])})
  /**
   * Autmatically generated unique identifier
   */
  public readonly uid: string
  /**
   * The graphics device
   */
  public readonly device: Device
  /**
   * The models local bounding box
   */
  public boundingBox: BoundingBox
  /**
   * The models local bounign sphere
   */
  public boundingSphere: BoundingSphere
  /**
   * Collection of materials that are used by the model meshes
   */
  public materials: Material[] = []
  /**
   * Collection of meshes
   */
  public parts: ModelMeshPart[] = []
  /**
   * The index of the parent bone for this mesh
   */
  public boneId: number | null = null
  /**
   * The name of this mesh
   */
  public name: string | null

  constructor(device: Device, options: ModelMeshOptions) {
    this.uid = uuid()
    this.device = device
    this.name = options.name
    this.boundingBox = BoundingBox.convert(options.boundingBox)
    this.boundingSphere = BoundingSphere.convert(options.boundingSphere)

    for (const mesh of (options.parts || [])) {
      if (mesh instanceof ModelMeshPart) {
        this.parts.push(mesh)
      } else {
        this.parts.push(new ModelMeshPart(this.device, mesh))
      }
    }

    for (const material of (options.materials || [])) {
      if (material instanceof Material) {
        this.materials.push(material)
      } else {
        this.materials.push(new Material(this.device, material))
      }
    }

    // convert materialIds from string name to numeric index
    for (const meshItem of this.parts) {
      const name = meshItem.materialId
      if (!isString(name)) {
        continue
      }
      let index = 0
      for (const materialItem of this.materials) {
        if (materialItem.name === name) {
          meshItem.materialId = index
          break
        }
        index += 1
      }
    }
  }

  /**
   * Simply iterates over all meshes and renders each with its assigned material
   *
   * @remarks
   * If a mesh points to a missing material it is silently ignored.
   */
  public draw(): this {
    const parts = this.parts
    let part: ModelMeshPart
    let material: Material
    for (let i = 0; i < parts.length; i++){
      part = parts[i]
      material = this.getMaterial(part.materialId || 0)
      if (material) {
        material.draw(part)
      }
    }
    return this
  }

  /**
   * Gets a material of this mesh by index or name
   *
   * @param indexOrName - The index or name of the material
   */
  public getMaterial(indexOrName: number | string): Material {
    return this.materials[indexOrName] || this.materials.find((it) => it.name === indexOrName)
  }
}
