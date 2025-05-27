import { MaterialOptions, MeshOptions, TextureOptions } from '@gglib/graphics'

/**
 * An asset container holding loaded data ready to create graphics resources.
 *
 * @remarks
 * Modeled after glTF 2.0 asset container.
 */
export interface AssetContainer {
  /**
   * The url where this asset was loaded from.
   */
  source: string

  meshes?: MeshOptions[]

  textures?: TextureOptions[]

  materials?: MaterialOptions[]

  scene?: number

  scenes?: Scene[]

  nodes?: Node[]
}

export interface Scene {
  name?: string

  extras?: any

  nodes?: number[]
}

export interface Node {
  /**
   * Name of the node.
   */
  name?: string

  /**
   * Application-specific data.
   */
  extras?: any

  /**
   * The indices of this node's children.
   */
  children?: number[]

  /**
   * The index of the camera referenced by this node.
   */
  camera?: number

  /**
   * The index of the skin referenced by this node.
   */
  skin?: number

  /**
   * A floating-point 4x4 transformation matrix stored in column-major order.
   */
  matrix?: number[]

  /**
   * The index of the mesh in this node.
   */
  mesh?: number

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

  /**
   * The weights of the instantiated Morph Target. Number of elements must match number of Morph Targets of used mesh.
   */
  weights?: number[]
}
