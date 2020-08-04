import { uuid, TypeToken } from '@gglib/utils'
import { Mat4, BoundingSphere, Quat, Vec3, Vec4 } from '@gglib/math'
import { Device } from '../Device'
import { AnimationData } from '../AnimationData'
import { AnimationPlayer } from '../AnimationPlayer'

import { ModelSkin } from './ModelSkin'
import { ModelMeshOptions, ModelMesh } from './ModelMesh'
import { ModelNode, ModelNodePose } from './ModelNode'
import { ModelPose } from './ModelPose'

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
   * The joint hierarchy list
   */
  public readonly nodes: ReadonlyArray<ModelNode>
  /**
   * Collection of skins
   */
  public readonly skins: ReadonlyArray<ModelSkin>
  /**
   * The ids of all root nodes
   */
  public readonly roots: ReadonlyArray<number>
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
    this.skins = options.skins || []
    this.animations = options.animations || []
    this.cameras = options.cameras || []

    this.meshes = meshes
    this.nodes = nodes
    this.roots = roots

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

  /**
   * Walks through the node hierarchy and calls the callback function
   *
   * @param visit - the callback function
   */
  public walkNodes(visit: (node: ModelNode, index: number, parent: number) => void) {
    Model.walkNodes(this.nodes, visit, this.roots, null)
  }

  public static walkNodes(nodes: ReadonlyArray<ModelNode>, visit: (node: ModelNode, index: number, parent: number) => void, ids: ReadonlyArray<number>, parent: number) {
    if (!ids) {
      return
    }
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]
      const node = nodes[id]
      if (node) {
        visit(node, id, parent)
        if (node.children) {
          this.walkNodes(nodes, visit, node.children, id)
        }
      }
    }
  }

  /**
   * Resolves a nodes local transform matrix
   *
   * @param node - the node
   * @param out - the resulting matrix
   */
  public static getLocalTransform(node: ModelNode, out?: Mat4): Mat4 {
    if (node.matrix?.length) {
      return out ? out.initFromArray(node.matrix) : Mat4.createFromArray(node.matrix)
    }
    out = out ? out.initIdentity() : Mat4.createIdentity()
    const t = node.translation
    if (t) {
      out.translate(t[0], t[1], t[2])
    }
    const r = node.rotation
    if (r) {
      out.rotateQuaternion(r[0], r[1], r[2], r[3])
    }
    const s = node.scale
    if (s) {
      out.scale(s[0], s[1], s[2])
    }
    return out
  }

  /**
   * Resolves the local pose for a given node
   *
   * @param node - the node
   * @param out - the resulting pose object
   */
  public static getLocalPose(node: ModelNode, out: ModelNodePose): ModelNodePose {
    if (node.matrix) {
      // node is not animated, copy the matrix
      out.matrix.initFromArray(node.matrix)
      return out
    }

    const t = node.translation
    const r = node.rotation
    const s = node.scale
    let isAnimated = false

    // if we are here, the node is animated
    // read the components and update the matrix
    if (t) {
      isAnimated = true
      out.translation = Vec3.init(out.translation || {}, t[0], t[1], t[2])
    }
    if (r) {
      isAnimated = true
      out.rotation = Vec4.init(out.rotation || {}, r[0], r[1], r[2], r[3])
    }
    if (s) {
      isAnimated = true
      out.scale = Vec3.init(out.scale || {}, s[0], s[1], s[2])
    }
    if (isAnimated) {
      this.updatePoseTransform(out)
    } else {
      // neither transformed nor animated
      // TODO: optimize?
      out.matrix.initIdentity()
    }
    return out
  }

  private static updatePoseTransform(out: ModelNodePose) {
    if (out.translation || out.rotation || out.scale) {
      out.matrix.initIdentity()
      if (out.translation) {
        out.matrix.translateV(out.translation)
      }
      if (out.rotation) {
        out.matrix.rotateQuat(out.rotation)
      }
      if (out.scale) {
        out.matrix.scaleV(out.scale)
      }
    }
    return out
  }

  /**
   * For each node it gets the locale node pose (translation, rotation, scale and matrix)
   *
   * @param out - where the results should be written to
   * @remarks
   * The `out` parameter may be an array of any length.
   * - If an entry for a node index exist it will be reused and the transforms will be overridden
   * - If an entry does not exist, it will be created
   * - The array will be capped at the maximum node id that has been seen in this model
   */
  public getLocalPose(out: ModelNodePose[]) {
    let max = 0
    this.walkNodes((node, id) => {
      out[id] = Model.getLocalPose(node, out[id] || { matrix: new Mat4() })
      max = Math.max(max, id)
    })
    out.length = max + 1
    return out
  }

  /**
   * For each node it gets the absolute transform matrix
   *
   * @param out - where the results should be written to
   * @param input - if set, this is treated as local pose array and used for the calculations
   */
  public getAbsoluteTransforms(out?: Mat4[], input?: ModelNodePose[]): Mat4[] {
    out = out || []
    let max = 0
    let child: Mat4
    let parent: Mat4

    this.walkNodes((node, id, parentId) => {
      max = Math.max(max, id)
      child = out[id] = (out[id] || Mat4.createIdentity())
      parent = out[parentId]
      if (input) {
        Model.updatePoseTransform(input[id])
        if (parent) {
          Mat4.multiply(parent, input[id].matrix, child)
        } else {
          child.initFrom(input[id].matrix)
        }
      } else {
        Model.getLocalTransform(node, child)
        if (parent) {
          Mat4.multiply(parent, child, child)
        }
      }
    })
    out.length = max + 1
    return out
  }

  public getAbsoluteBoundingSphere(transforms: Mat4[] = this.getAbsoluteTransforms()) {
    let result: BoundingSphere
    let temp = new BoundingSphere()
    this.walkNodes((node, id) => {
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
