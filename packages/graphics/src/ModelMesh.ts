import { BoundingBox, BoundingSphere } from '@gglib/math'
import { isString, uuid } from '@gglib/utils'
import { Device } from './Device'
import { Material, MaterialOptions } from './Material'
import { ModelMeshPart, ModelMeshPartOptions } from './ModelMeshPart'

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
  materials?: Array<Material | MaterialOptions | string>
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
  public static readonly Array = Symbol('ModelMesh[]')
  /**
   * A symbol identifying the `ModelMeshOptions` type.
   */
  public static readonly Options = Symbol('ModelMeshOptions')
  /**
   * A symbol identifying the `ModelMeshOptions[]` type.
   */
  public static readonly OptionsArray = Symbol('ModelMeshOptions[]')
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

  constructor(device: Device, options: ModelMeshOptions) {
    this.uid = uuid()
    this.device = device
    this.boundingBox = BoundingBox.convert(options.boundingBox)
    this.boundingSphere = BoundingSphere.convert(options.boundingSphere)

    for (const mesh of (options.parts || [])) {
      if (mesh instanceof ModelMeshPart) {
        this.parts.push(mesh)
      } else {
        this.parts.push(new ModelMeshPart(this.device, mesh))
      }
    }

    const materials: Material[] = []
    for (const material of (options.materials || [])) {
      if (material instanceof Material) {
        this.materials.push(material)
      } else if (typeof material === 'string') {
        throw new Error(`[ModelMesh] can not use string as material: ${material}`)
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
      for (const materialItem of materials) {
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
    for (const mesh of this.parts) {
      const material: Material = this.getMaterial(mesh.materialId) || this.materials[0]
      if (!material) {
        // mesh has no material so it can not be rendered
        continue
      }
      material.draw(mesh)
    }
    return this
  }

  /**
   * Gets a material of this mesh by index or name
   *
   * @param indexOrName - The index or name of the material
   */
  public getMaterial(indexOrName: number | string) {
    return this.materials[indexOrName] || this.materials.find((it) => it.name === indexOrName)
  }
}
