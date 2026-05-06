import { Brand } from '@gglib/utils'
import type { GameEntity } from './GameEntity'
import type { AbstractType, GameTypeToken, Type } from './types'
import { idProvider } from './utils/idProvider'

export type GameComponentType<T extends GameComponent = GameComponent> = Type<T> | AbstractType<T> | GameTypeToken<T>

export interface GameComponent extends Partial<InitializableComponent & ActivatableComponent> {
  /**
   * The entity that owns this component
   * @remarks
   * This is automatically being set by the system
   */
  entity: GameEntity
}

export interface InitializableComponent {
  /**
   * Initializes the component allowing it to setup references to other components and systems
   */
  initialize(): void
  /**
   * Destroys the component, cleaning up any resources it has allocated
   */
  destroy?(): void
}

export interface ActivatableComponent {
  /**
   * Activates the component, allowing it to listen for game events and hooks into the game loop
   */
  activate(): void
  /**
   * Deactivates the component, stopping all its activities
   */
  deactivate(): void
}

export type GameComponentId = Brand<number, 'GameComponentId'>
export type GameComponentTypeId = Brand<number, 'GameComponentTypeId'>

export const ComponentIds = idProvider<GameComponentId, GameComponent>(Symbol('GameComponentId'))
export const ComponentTypeIds = idProvider<GameComponentTypeId, GameComponentType<any>>(Symbol('GameComponentTypeId'))

export function getComponentType<T>(instance: T): Type<T> | null {
  if (!instance) {
    return null
  }
  if (instance.constructor && instance.constructor !== Object.constructor) {
    return instance.constructor as Type<T>
  }
  return null
}
