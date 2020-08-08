import { GLTFRootProperty } from './common'

/**
 * The root nodes of a scene.
 */
export interface GLTFScene extends GLTFRootProperty {
  /**
   * The indices of each root node.
   */
  nodes?: number[]
}
