import { Entity } from './Entity'

/**
 * A life cycle hook that is called when the component has been added to the entity
 */
export interface OnAdded {
  /**
   * A method that is called when the component has been added to the entity
   * which may happen before the initialization.
   *
   * @param entity - The entity that the component has been added to
   */
  onAdded: (entity: Entity) => void
}

/**
 * A life cycle hook that is called when the component has been removed from an entity
 */
export interface OnRemoved {
  /**
   * A method that is called when the component has been removed from an entity.
   *
   * @param entity - The entity that the component has been removed from
   */
  onRemoved: (entity: Entity) => void
}

/**
 * A life cycle hook that is called when the component must be initialized
 */
export interface OnInit {
  /**
   * A method that is called when the component must be initialized
   */
  onInit: (entity: Entity) => void
}

/**
 * A life cycle hook that is called once every update cycle
 */
export interface OnUpdate {
  /**
   * A method that is called when once every update cycle
   */
  onUpdate: (elapsedTime: number) => void
}

/**
 * A life cycle hook that is called once every draw cycle
 */
export interface OnDraw {
  /**
   * A method that is called when once every draw cycle
   */
  onDraw: (elapsedTime: number) => void
}

/**
 * @public
 */
export interface Component extends Partial<OnAdded & OnRemoved & OnInit & OnUpdate & OnDraw> {
  name?: string
}
