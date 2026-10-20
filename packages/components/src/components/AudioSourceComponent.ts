import type { ActivatableComponent, GameComponent, GameEntity } from '@gglib/ecs'
import type { AudioSystem } from '../systems/AudioSystem'
import type { TransformComponent } from './TransformComponent'

/**
 * Constructor options for {@link AudioSourceComponent}. See the component fields for details
 *
 * @public
 */
export interface AudioSourceComponentOptions {
  clip?: AudioBuffer | null
  volume?: number
  playbackRate?: number
  loop?: boolean
  autoplay?: boolean
  spatial?: boolean
  refDistance?: number
  maxDistance?: number
  rolloffFactor?: number
  distanceModel?: DistanceModelType
}

/**
 * The web audio nodes of a playing {@link AudioSourceComponent}
 *
 * @internal
 */
export interface AudioSourceVoice {
  source: AudioBufferSourceNode
  gain: GainNode
  panner: PannerNode | null
  ended: boolean
}

/**
 * Plays an audio clip at the position of the entity
 *
 * @public
 * @remarks
 * Requires a {@link TransformComponent}. The component only holds data, the {@link AudioSystem} plays the sounds.
 * {@link AudioSourceComponent.play} and {@link AudioSourceComponent.stop} are requests that the system applies in its
 * next render step. Changes to volume, playback rate, loop and the distance settings apply to a playing sound.
 *
 * A spatial source is attenuated and panned relative to the `AudioListenerComponent`, a non spatial source plays at
 * the same volume everywhere, e.g. for music.
 *
 * The sound stops when the entity is deactivated. With {@link AudioSourceComponent.autoplay} it starts again when the
 * entity is activated.
 */
export class AudioSourceComponent implements GameComponent, ActivatableComponent {
  public readonly entity: GameEntity

  /**
   * The audio to play. Load it with `content.load(AudioAssetType, url)`
   */
  public clip: AudioBuffer | null = null
  /**
   * The volume
   */
  public volume = 1
  /**
   * The playback rate, also changes the pitch
   */
  public playbackRate = 1
  /**
   * Whether the clip repeats until it is stopped
   */
  public loop = false
  /**
   * Whether the clip starts playing when the entity is activated
   */
  public autoplay = false
  /**
   * Whether the sound is attenuated and panned by the distance to the listener
   */
  public spatial = true
  /**
   * Distance at which the volume starts to drop
   */
  public refDistance = 1
  /**
   * Distance after which the volume does not drop any further. Only for the `linear` distance model
   */
  public maxDistance = 10000
  /**
   * How fast the volume drops with distance
   */
  public rolloffFactor = 1
  /**
   * The formula that reduces the volume with distance
   */
  public distanceModel: DistanceModelType = 'inverse'

  /**
   * Whether a sound of this source is playing
   */
  public get isPlaying(): boolean {
    return this.pending === 'play' || (this.pending !== 'stop' && !!this.voice && !this.voice.ended)
  }

  /**
   * The nodes of the playing sound, maintained by the {@link AudioSystem}
   *
   * @internal
   */
  public voice: AudioSourceVoice | null = null

  /**
   * The request that the {@link AudioSystem} applies in its next render step
   *
   * @internal
   */
  public pending: 'play' | 'stop' | null = null

  public constructor(options?: AudioSourceComponentOptions) {
    if (options) {
      Object.assign(this, options)
    }
  }

  /**
   * Plays the clip from the start. A sound that is already playing is restarted
   */
  public play(): this {
    this.pending = 'play'
    return this
  }

  /**
   * Stops the sound
   */
  public stop(): this {
    this.pending = 'stop'
    return this
  }

  /**
   * Sets the clip to play
   */
  public setClip(clip: AudioBuffer | null): this {
    this.clip = clip
    return this
  }

  public activate(): void {
    this.pending = this.autoplay ? 'play' : null
  }

  public deactivate(): void {
    this.pending = 'stop'
  }
}
