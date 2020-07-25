import { uuid, TypeToken } from '@gglib/utils'
import { Mat4, BoundingSphere, Quat, Vec3, Vec4 } from '@gglib/math'
import { Device } from './Device'
import { ModelMeshOptions, ModelMesh } from './ModelMesh'
import { ModelNode, ModelNodePose } from './ModelNode'
import { AnimationData, AnimationTargetPose } from './AnimationData'
import { AnimationPlayer } from './AnimationPlayer'

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
   * Scene nodes
   */
  nodes?: ModelNode[]
  /**
   * Indices of the root nodes
   */
  roots?: number[]
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
   * The ids of all root nodes
   */
  public readonly roots: ReadonlyArray<number>
  /**
   * Model animation data
   */
  public readonly animations?: AnimationData[]

  private player: AnimationPlayer

  constructor(device: Device, options: ModelOptions) {
    this.uid = uuid()
    this.device = device

    const meshes: ModelMesh[] = []
    const nodes = options.nodes || []
    const roots = options.roots || []
    this.animations = options.animations || []

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
   * If a mesh points to a missing material it is silently ignored.
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
    this.walk(visit, this.roots, null)
  }

  /**
   * Resolves a nodes local transform matrix
   *
   * @param node - the node
   * @param out - the resulting matrix
   */
  public getNodeTransform(node: ModelNode, out: Mat4 = Mat4.createIdentity()): Mat4 {
    if (node.matrix) {
      out.initFromArray(node.matrix)
    } else {
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
    }
    return out
  }

  /**
   * Resolves a nodes local transform matrix and possibly animated components for a node
   *
   * @param node - the node
   * @param out - the resulting pose object
   */
  public getNodePose(node: ModelNode, out: ModelNodePose) {
    if (node.matrix) {
      out.matrix.initFromArray(node.matrix)
    } else {
      // if we are here, the node is animated
      // read the components and update the matrix
      {
        const t = node.translation
        if (t) {
          out.translation = Vec3.init(out.translation || {}, t[0], t[1], t[2])
        }
      }
      {
        const r = node.rotation
        if (r) {
          out.rotation = Vec4.init(out.rotation || {}, r[0], r[1], r[2], r[3])
        }
      }
      {
        const s = node.scale
        if (s) {
          out.scale = Vec3.init(out.scale || {}, s[0], s[1], s[2])
        }
      }
      this.updatePoseTransform(out)
    }
    return out
  }

  private updatePoseTransform(out: ModelNodePose) {
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
    return out
  }

  /**
   * For each node it gets the locale node pose (translation, rotation, scale and matrix)
   *
   * @param out - where to write the results (may be an empty array)
   */
  public getLocalPose(out: ModelNodePose[]) {
    let max = 0
    this.walkNodes((node, id) => {
      out[id] = this.getNodePose(node, out[id] || { matrix: new Mat4() })
      max = Math.max(max, id)
    })
    out.length = max + 1
    return out
  }

  /**
   * Having a local pose as input this calculates the absolute transform for each node
   *
   * @param out - where to write the results (may be an empty array)
   * @param input - optional preanimated pose
   */
  public getAbsoluteTransforms(out?: Mat4[], input?: ModelNodePose[]): Mat4[] {
    out = out || []
    let max = 0
    this.walkNodes((node, id, parentId) => {
      max = Math.max(max, id)
      if (input && input[id]) {
        this.updatePoseTransform(input[id])
        out[id].initFrom(input[id].matrix)
      } else {
        out[id] = this.getNodeTransform(node, out[id])
      }

      if (out[parentId]) {
        Mat4.premultiply(out[id], out[parentId], out[id])
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

  public getAnimationPlayer(): AnimationPlayer | null {
    if (this.player) {
      return this.player
    }
    if (this.animations?.length) {
      this.player = new AnimationPlayer(this.animations)
    }
    return this.player || null
  }

  private walk(visit: (node: ModelNode, index: number, parent: number) => void, ids: ReadonlyArray<number>, parent: number) {
    if (!ids) {
      return
    }
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]
      const node = this.nodes[id]
      if (!node) {
        continue
      }
      visit(node, id, parent)
      if (node.children) {
        this.walk(visit, node.children, id)
      }
    }
  }
}
