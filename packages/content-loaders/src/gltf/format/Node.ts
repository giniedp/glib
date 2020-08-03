import { RootProperty } from './common'

/**
 * A node in the node hierarchy.
 *
 * @remarks
 * When the node contains `skin`, all `mesh.primitives` must contain `JOINTS_0` and `WEIGHTS_0` attributes.
 * A node can have either a `matrix` or any combination of `translation`/`rotation`/`scale` (TRS) properties.
 * TRS properties are converted to matrices and postmultiplied in the `T * R * S` order to compose the transformation matrix;
 * first the scale is applied to the vertices, then the rotation, and then the translation.
 * If none are provided, the transform is the identity.
 * When a node is targeted for animation (referenced by an animation.channel.target), only TRS properties may be present;
 * `matrix` will not be present.
 */
export interface Node extends RootProperty {
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
