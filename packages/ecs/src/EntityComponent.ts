import { Entity } from './Entity'

/**
 * A life cycle hook that is called when the entity has been added to its parent
 *
 * @public
 */
export interface OnAttached {
  /**
   * A method that is called when the entity has been added to its parent
   *
   * @param entity - The entity
   */
  onAttached: (entity: Entity) => void
}

/**
 * A life cycle hook that is called when the entity is about to be removed from its parent
 *
 * @public
 */
export interface OnDetach {
  /**
   * A method that is called when the entity is about to be removed from its parent
   *
   * @param entity - The entity
   */
  onDetach: (entity: Entity) => void
}

/**
 * A life cycle hook that is called when a component is installed with options
 *
 * @public
 */
export interface OnSetup<T = any> {
  /**
   * A method that is called when the component is installed with options
   */
  onSetup: (options: T) => void
}

export type OnSetupOptions<T extends OnSetup> = T extends OnSetup<infer O> ? O : unknown

/**
 * A life cycle hook that is called when the component has been added to the entity
 *
 * @public
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
 *
 * @public
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
 *
 * @public
 */
export interface OnInit {
  /**
   * A method that is called when the component must be initialized
   */
  onInit: (entity: Entity) => void
}

/**
 * A life cycle hook that is called once every update cycle
 *
 * @public
 */
export interface OnUpdate {
  /**
   * A method that is called when once every update cycle
   */
  onUpdate: (elapsedTime: number) => void
}

/**
 * A life cycle hook that is called once every draw cycle
 *
 * @public
 */
export interface OnDraw {
  /**
   * A method that is called when once every draw cycle
   */
  onDraw: (elapsedTime: number) => void
}

/**
 * A life cycle hook that is called when an entity is being destroyed
 *
 * @public
 */
export interface OnDestroy {
  /**
   * A method that is called when the entity is being destroyed
   */
  onDestroy: (entity: Entity) => void
}

/**
 * @public
 */
export interface EntityComponent extends Object, Partial<OnAttached & OnDetach & OnAdded & OnRemoved & OnSetup & OnInit & OnUpdate & OnDraw & OnDestroy> {
  name?: string
}
