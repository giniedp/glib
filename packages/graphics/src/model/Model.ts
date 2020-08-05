import { uuid, TypeToken } from '@gglib/utils'
import { Mat4, BoundingSphere, Quat, Vec3, Vec4 } from '@gglib/math'
import { Device } from '../Device'
import { AnimationData } from '../AnimationData'
import { AnimationPlayer } from '../AnimationPlayer'

import { ModelSkin } from './ModelSkin'
import { ModelMeshOptions, ModelMesh } from './ModelMesh'
import { ModelNode, ModelNodePose } from './ModelNode'
import { ModelPose } from './ModelPose'
import { ModelNodeHierarchy } from './ModelNodeHierarchy'

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
   * Model animation data
   */
  animations?: AnimationData[]
  /**
   * Collection of skins
   */
  skins?: ModelSkin[]
  /**
   * Scene nodes
   */
  nodes?: ModelNode[]
  /**
   * Indices of the root nodes
   */
  roots?: number[]
  /**
   * Collection of cameras to preview this model
   */
  cameras?: any[]
}

/**
 * @public
 */
export class Model {
  /**
   * A symbol identifying the `Model[]` type.
   */
  public static readonly Array = new TypeToken<Model[]>('Model[]', { factory: () => []})
  /**
   * A symbol identifying the `ModelOptions` type.
   */
  public static readonly Options = new TypeToken<ModelOptions>('ModelOptions', { factory: () => ({})})
  /**
   * A symbol identifying the `ModelOptions[]` type.
   */
  public static readonly OptionsArray = new TypeToken<ModelOptions[]>('ModelOptions[]', { factory: () => ([])})
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
  public readonly meshes: ReadonlyArray<ModelMesh>
  /**
   * Collection of skins
   */
  public readonly skins: ReadonlyArray<ModelSkin>
  /**
   * The node hierarchy
   */
  public readonly hierarchy: ModelNodeHierarchy
  /**
   * Model animation data
   */
  public readonly animations?: AnimationData[]
  /**
   * Collection of cameras to preview this model
   */
  public readonly cameras?: any[]

  private player: AnimationPlayer
  private pose: ModelPose

  constructor(device: Device, options: ModelOptions) {
    this.uid = uuid()
    this.device = device

    const meshes: ModelMesh[] = []
    const nodes = options.nodes || []
    const roots = options.roots || []

    for (const mesh of (options.meshes || [])) {
      if (mesh instanceof ModelMesh) {
        meshes.push(mesh)
      } else {
        meshes.push(new ModelMesh(this.device, mesh))
      }
    }
    if (!nodes.length) {
      for (let i = 0; i < meshes.length; i++) {
        nodes.push({ mesh: i })
        roots.push(i)
      }
    }
    if (roots.length === 0) {
      roots.push(0)
    }

    this.skins = options.skins || []
    this.animations = options.animations || []
    this.cameras = options.cameras || []
    this.meshes = meshes
    this.hierarchy = new ModelNodeHierarchy(nodes, roots)
  }

  /**
   * Simply iterates over all meshes and renders each with its assigned material
   *
   * @remarks
   * This ignores the model nodes and just calls `draw()` for each mesh.
   */
  public draw(): Model {
    for (const mesh of this.meshes) {
      mesh.draw()
    }
    return this
  }

  public getAbsoluteBoundingSphere(transforms: ReadonlyArray<Mat4> = this.hierarchy.globalTransforms) {
    let result: BoundingSphere
    let temp = new BoundingSphere()
    this.hierarchy.walk((node, id) => {
      let sphere = this.meshes[node.mesh]?.boundingSphere
      if (!sphere) {
        return
      }
      BoundingSphere.transform(sphere, transforms[id], temp)
      if (!result) {
        result = BoundingSphere.createFrom(temp)
      } else {
        result.mergeSphere(temp)
      }
    })
    return result
  }

  public getPose(options?: { copy?: boolean }): ModelPose {
    if (this.pose && !options?.copy) {
      return this.pose
    }
    this.pose = new ModelPose(this)
    return this.pose
  }

  public getAnimationPlayer(options?: { copy?: boolean }): AnimationPlayer | null {
    if (this.player && !options?.copy) {
      return this.player
    }
    if (this.animations?.length) {
      this.player = new AnimationPlayer(this.animations)
    }
    return this.player || null
  }
}
