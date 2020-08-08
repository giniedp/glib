import { GLTFRootProperty } from './common'

/**
 * Joints and matrices defining a skin.
 */
export interface GLTFSkin extends GLTFRootProperty {

  /**
   * The index of the accessor containing the floating-point 4x4 inverse-bind matrices.
   * The default is that each matrix is a 4x4 identity matrix, which implies that inverse-bind matrices were pre-applied.
   */
  inverseBindMatrices?: number

  /**
   * The index of the node used as a skeleton root. When undefined, joints transforms resolve to scene root.
   */
  skeleton?: number

  /**
   * Indices of skeleton nodes, used as joints in this skin.
   *
   * @remark
   * Indices of skeleton nodes, used as joints in this skin.
   * The array length must be the same as the `count` property of the `inverseBindMatrices` accessor (when defined).
   */
  joints: number[]
}
