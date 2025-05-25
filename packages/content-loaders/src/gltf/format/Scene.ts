import { NamedProperty } from './common'

/**
 * The root nodes of a scene.
 */
export interface Scene extends NamedProperty {
  /**
   * The indices of each root node.
   */
  nodes?: number[]
}
