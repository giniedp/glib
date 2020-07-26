import { Mat4 } from '@gglib/math'
import { AnimationTargetPose } from '../AnimationData'

export interface ModelNode {
  /**
   * Name of this node
   */
  name?: string

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

export interface ModelNodePose extends AnimationTargetPose {
  /**
   * The resulting pose matrix
   */
  matrix: Mat4
}
