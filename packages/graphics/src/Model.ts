import { uuid } from '@gglib/utils'
import { Device } from './Device'
import { ModelAnimationClip } from './ModelAnimation'
import { ModelSkin } from './ModelSkin'
import { ModelMeshOptions, ModelMesh } from './ModelMesh'

/**
 * @public
 */
export interface ModelOptions {
  /**
   * The user defined name of the model
   */
  name?: string
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
    this.skin = options.skin
    this.clips = options.clips

    for (const mesh of (options.meshes || [])) {
      if (mesh instanceof ModelMesh) {
        this.meshes.push(mesh)
      } else {
        this.meshes.push(new ModelMesh(this.device, mesh))
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
      mesh.draw()
    }
    return this
  }
}
