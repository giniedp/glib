import type { GameComponent, GameEntity } from '@gglib/ecs'
import type { AudioSystem } from '../systems/AudioSystem'
import type { TransformComponent } from './TransformComponent'

/**
 * Constructor options for {@link AudioListenerComponent}
 *
 * @public
 */
export interface AudioListenerComponentOptions {
  /**
   * Volume of everything this listener hears. Defaults to `1`
   */
  volume?: number
}

/**
 * Marks the entity that hears the sounds, usually the camera
 *
 * @public
 * @remarks
 * Requires a {@link TransformComponent}. The {@link AudioSystem} moves the listener of the audio context to the world
 * transform of the entity. There is only one listener per audio context, the system uses the first active entity with
 * this component.
 */
export class AudioListenerComponent implements GameComponent {
  public readonly entity: GameEntity

  /**
   * Volume of everything this listener hears, multiplied with the master volume of the {@link AudioSystem}
   */
  public volume: number

  public constructor(options?: AudioListenerComponentOptions) {
    this.volume = options?.volume ?? 1
  }
}
