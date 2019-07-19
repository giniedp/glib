import { BoundingBox, BoundingSphere, Mat4 } from '@gglib/math'
import { flattenArray, isString, uuid } from '@gglib/utils'
import { Device } from './Device'
import { Material, MaterialOptions } from './Material'
import { ModelAnimationClip } from './ModelAnimation'
import { ModelMesh, ModelMeshOptions } from './ModelMesh'
import { ModelSkin } from './ModelSkin'

/**
 * @public
 */
export interface ModelOptions {
  /**
   * The user defined name of the model
   */
  name?: string
  /**
   * The axis aligned bounding box containing all meshes
   */
  boundingBox?: number[] | BoundingBox
  /**
   * The bounding sphere containing all meshes
   */
  boundingSphere?: number[] | BoundingSphere
  /**
   * Collection of materials that are used by the model meshes
   */
  materials?: Array<Material | MaterialOptions | string>
  /**
   * Collection of meshes
   */
  meshes?: Array<ModelMesh | ModelMeshOptions>
  /**
   * The skin data with skeleton hierarchy, bind pose and inverse matrices
   */
  skin?: ModelSkin
  /**
   * Collection of all animation clips for this model
   */
  clips?: ModelAnimationClip[]
}

/**
 * @public
 */
export class Model {
  /**
   * A symbol identifying the `Model[]` type.
   */
  public static readonly Array = Symbol('Model[]')
  /**
   * A symbol identifying the `ModelOptions` type.
   */
  public static readonly Options = Symbol('ModelOptions')
  /**
   * A symbol identifying the `ModelOptions[]` type.
   */
  public static readonly OptionsArray = Symbol('ModelOptions[]')
  /**
   * Autmatically generated unique identifier
   */
  public readonly uid: string
  /**
   * The graphics device
   */
  public readonly device: Device
  /**
   * The GL handler
   */
  public readonly gl: any
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
  public meshes: ModelMesh[] = []
  /**
   * The skin data with skeleton hierarchy, bind pose and inverse matrices
   */
  public skin?: ModelSkin
  /**
   * Collection of all animation clips for this model
   */
  public clips?: ModelAnimationClip[]

  constructor(device: Device, options: ModelOptions) {
    this.uid = uuid()
    this.device = device
    this.gl = device.context
    this.boundingBox = BoundingBox.convert(options.boundingBox)
    this.boundingSphere = BoundingSphere.convert(options.boundingSphere)
    this.skin = options.skin
    this.clips = options.clips

    const meshes = [].concat.apply([], options.meshes || [])
    for (let mesh of meshes) {
      if (mesh instanceof ModelMesh) {
        this.meshes.push(mesh)
      } else {
        this.meshes.push(new ModelMesh(this.device, mesh))
      }
    }

    const materials: Material[] = []
    for (const material of flattenArray(options.materials)) {
      if (material instanceof Material) {
        this.materials.push(material)
      } else if (typeof material === 'string') {
        throw new Error(`[Model] can not use string as material: ${material}`)
      } else {
        this.materials.push(new Material(this.device, material))
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

  /**
   * Simply iterates over all meshes and renders each with its assigned material
   *
   * @remarks
   * If a mesh points to a missing material it is silently ignored.
   */
  public draw(): Model {
    for (const mesh of this.meshes) {
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
