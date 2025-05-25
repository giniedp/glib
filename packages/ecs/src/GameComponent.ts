import type { GameEntity } from './GameEntity'
import { AbstractType, Type, GameType } from './types'

export type GameComponentType<T extends GameComponent> = Type<T> | AbstractType<T> | GameType<T>

export interface GameComponent<Entity extends GameEntity = GameEntity> {
  /**
   * The game entity that this component is attached to.
   */
  entity: Entity
  /**
   * Initializes the component allowing it to setup references to other components and systems
   */
  initialize(entity: Entity): void
  /**
   * Activates the component, allowing it to listen for game events and hooks into the game loop
   */
  activate(): void
  /**
   * Deactivates the component, stopping all its activities
   */
  deactivate(): void
  /**
   * Destroys the component, cleaning up any resources it has allocated
   */
  destroy(): void
}
