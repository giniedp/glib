import { ActivatableComponent, GameComponent, GameEntity } from '@gglib/ecs'
import { IVec3, vec3 } from '@gglib/math'
import type { ParticleSystem } from '../systems/ParticleSystem'
import type { TransformComponent } from './TransformComponent'

/**
 * Constructor options for {@link ParticleEmitterComponent}
 *
 * @public
 */
export interface ParticleEmitterComponentOptions {
  /**
   * Name of the {@link ParticleSystem} channel to emit into
   */
  channel: string
  /**
   * Number of particles per second. Defaults to `10`
   */
  frequency?: number
  /**
   * Velocity of the particles in local space of the emitter. Defaults to zero
   */
  velocity?: IVec3
  /**
   * How much of the emitter movement is added to the particle velocity. Defaults to `1`
   */
  inheritVelocity?: number
}

/**
 * Describes where and how many particles a {@link ParticleSystem} emits into one of its channels
 *
 * @public
 * @remarks
 * Requires a {@link TransformComponent}. Place the emitter on a child entity to emit at an offset of a moving object.
 * The {@link ParticleSystem} emits the particles of all active emitters in its update.
 * Particles of one update are spread along the path the emitter moved during that update,
 * and inherit the velocity of the emitter, scaled by {@link ParticleEmitterComponent.inheritVelocity}.
 * The channel scales the resulting velocity again by its `emitterVelocitySensitivity`.
 */
export class ParticleEmitterComponent implements GameComponent, ActivatableComponent {
  public readonly entity: GameEntity

  /**
   * Name of the {@link ParticleSystem} channel to emit into
   */
  public channel: string

  /**
   * Number of particles per second. Set to `0` to stop emitting
   */
  public frequency: number

  /**
   * Velocity of the particles in local space of the emitter
   */
  public velocity: IVec3 = vec3()

  /**
   * How much of the emitter movement is added to the particle velocity
   */
  public inheritVelocity: number

  /**
   * World position of the emitter in the previous update, maintained by the {@link ParticleSystem}
   *
   * @internal
   */
  public lastPosition: IVec3 = vec3()

  /**
   * Whether {@link ParticleEmitterComponent.lastPosition} is set
   *
   * @internal
   */
  public hasLastPosition = false

  /**
   * Time that is left over from the previous update, maintained by the {@link ParticleSystem}
   *
   * @internal
   */
  public timeFraction = 0

  public constructor(options: ParticleEmitterComponentOptions) {
    this.channel = options.channel
    this.frequency = options.frequency ?? 10
    this.inheritVelocity = options.inheritVelocity ?? 1
    this.velocity = vec3(options.velocity ?? 0)
  }

  public activate(): void {
    // don't spread particles along the way the entity moved while it was inactive
    this.hasLastPosition = false
    this.timeFraction = 0
  }

  public deactivate(): void {
    //
  }
}
