import { Mesh, MeshOptions } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import { AnimationData } from './AnimationData'

/**
 * @public
 */
export interface ModelData {
  /**
   * The user defined name of the model
   */
  name?: string

  /**
   * The user defined meta data of the model
   */
  meta?: Record<string, any>

  /**
   * Collection of meshes
   */
  meshes?: Array<Mesh | MeshOptions>

  /**
   * Model animation data
   */
  animations?: AnimationData[]

  /**
   * Collection of skins
   */
  skins?: SkinData[]

  /**
   * Scene nodes
   */
  nodes?: NodeData[]

  /**
   * The index of the default scene.
   */
  scene?: number

  /**
   *
   */
  scenes?: SceneData[]

  /**
   * Collection of cameras to preview this model
   */
  cameras?: any[]
}

export interface SkinData {
  /**
   * Application-specific name
   */
  name?: string

  /**
   * The 4x4 inverse-bind matrices.
   * The default is that each matrix is a 4x4 identity matrix, which implies that inverse-bind matrices were pre-applied.
   */
  inverseBindMatrices?: Mat4[]

  /**
   * The index of the node used as a skeleton root. When undefined, joints transforms resolve to scene root.
   */
  skeleton?: number

  /**
   * Indices of skeleton nodes, used as joints in this skin.
   *
   * @remark
   * The array length must be the same as the `count` property of the `inverseBindMatrices` accessor (when defined).
   */
  joints: number[]
}

export interface SceneData {
  /**
   * Application-specific name
   */
  name?: string

  /**
   * Dictionary object with extension-specific objects.
   */
  extensions?: Record<string, any>

  /**
   * Application-specific data.
   */
  extras?: Record<string, any>

  /**
   * The indices of each root node.
   */
  nodes: number[]
}

export interface NodeData {
  /**
   * Application-specific name
   */
  name?: string

  /**
   * Dictionary object with extension-specific objects.
   */
  extensions?: Record<string, any>

  /**
   * Application-specific data.
   */
  extras?: Record<string, any>

  /**
   * The index of the camera referenced by this node.
   */
  camera?: number

  /**
   * The indices of this node's children.
   */
  children?: number[]

  /**
   * The index of the skin referenced by this node.
   */
  skin?: number

  /**
   * The index of the mesh in this node.
   */
  mesh?: number

  /**
   * The weights of the instantiated Morph Target. Number of elements must match number of Morph Targets of used mesh.
   */
  weights?: number[]

  /**
   * A floating-point 4x4 transformation matrix stored in column-major order.
   */
  matrix?: number[]

  /**
   * The node's unit quaternion rotation in the order (x, y, z, w), where w is the scalar.
   */
  rotation?: number[]

  /**
   * The node's non-uniform scale, given as the scaling factors along the x, y, and z axes.
   */
  scale?: number[]

  /**
   * The node's translation along the x, y, and z axes.
   */
  translation?: number[]
}
