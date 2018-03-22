import { Entity } from './Entity'

/**
 * @public
 */
export interface Component {
  /**
   * The entity that is holding this component
   */
  entity?: Entity
  /**
   * The name of this component
   */
  name?: string
  /**
   * Indicates whether this component is a service
   */
  service?: boolean
  /**
   * Indicates whether this component is already initializes and so
   * the setup routine should not be called
   */
  initialized?: boolean
  /**
   * Indicates whether this component is enabled and so the
   * update and draw routines will be called
   */
  enabled?: boolean
  /**
   * Indicates whether this component is visible and so the
   * draw routine will be called
   */
  visible?: boolean
  /**
   * The initialisation routine for this component
   */
  setup?: (entity: Entity) => void
  /**
   * The update routine for this component
   */
  update?: (time?: number) => void
  /**
   * The render routine for this component
   */
  draw?: (time?: number) => void
}
