import { RootProperty } from './common'

/**
 * The root nodes of a scene.
 */
export interface Scene extends RootProperty {
  /**
   * The indices of each root node.
   */
  nodes?: number[]
}
