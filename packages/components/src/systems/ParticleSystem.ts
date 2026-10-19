import { GameEntity, GameQuery, GameSystem, GameWorld } from '@gglib/ecs'
import { ParticleChannel, ParticleChannelOptions } from '@gglib/effects'
import { Device } from '@gglib/graphics'
import { IVec3, vec3, vec3$initFrom } from '@gglib/math'
import { MeshComponent } from '../components/MeshComponent'
import { ParticleEmitterComponent } from '../components/ParticleEmitterComponent'
import type { SceneComponent } from '../components/SceneComponent'
import { TransformComponent } from '../components/TransformComponent'
import { EcsGame } from './EcsGame'
/**
 * Constructor options for {@link ParticleSystem}
 *
 * @public
 */
export interface ParticleSystemOptions {
  /**
   * The scene to render into. Defaults to the scene of the {@link EcsGame}
   */
  scene?: SceneComponent
}

interface ChannelEntry {
  channel: ParticleChannel
  entity: GameEntity | null
}

const position = vec3()
const velocity = vec3()
const emitVelocity = vec3()

/**
 * Manages named {@link ParticleChannel}s and renders them in a scene
 *
 * @public
 * @remarks
 * Each channel is rendered by an entity with a {@link MeshComponent} that holds the mesh of the channel.
 * The channel is a transparent mesh, so it needs a transparent pass in the render pipeline.
 *
 * Particles are emitted with {@link emit} or by entities with a {@link ParticleEmitterComponent},
 * which the system processes in its update. The particles of an update are uploaded in the render step.
 * Add the system after the systems that move the emitters (e.g. the `BehaviorSystem`), so particles are emitted at
 * the current positions, and before the `Renderer`, so they are uploaded before the scene is drawn.
 *
 * @example
 * ```ts
 * world.addSystem(new ParticleSystem(device))
 * const particles = world.getSystem(ParticleSystem)
 * particles.addChannel('smoke', { duration: 2, texture })
 * entity.addComponent(new ParticleEmitterComponent({ channel: 'smoke', frequency: 10 }))
 * ```
 */
export class ParticleSystem extends GameSystem {
  private world: GameWorld
  private device: Device
  private options: ParticleSystemOptions
  private channels = new Map<string, ChannelEntry>()
  private emitters: GameQuery
  private dt = 0

  public constructor(device: Device, options?: ParticleSystemOptions) {
    super()
    this.device = device
    this.options = options ?? {}
  }

  public override initialize(world: GameWorld): void {
    this.world = world
    this.emitters = world.query({ scope: 'active', required: [ParticleEmitterComponent, TransformComponent] })
  }

  public override destroy(): void {
    for (const name of Array.from(this.channels.keys())) {
      this.removeChannel(name)
    }
  }

  /**
   * Creates a channel with the given name
   */
  public addChannel(name: string, options?: ParticleChannelOptions): ParticleChannel {
    if (this.channels.has(name)) {
      throw new Error(`Particle channel '${name}' already exists`)
    }
    const channel = new ParticleChannel(this.device, options)
    this.channels.set(name, { channel, entity: null })
    return channel
  }

  /**
   * Gets the channel with the given name
   */
  public getChannel(name: string): ParticleChannel | null {
    return this.channels.get(name)?.channel ?? null
  }

  /**
   * Removes and disposes the channel with the given name
   */
  public removeChannel(name: string) {
    const entry = this.channels.get(name)
    if (!entry) {
      return
    }
    this.channels.delete(name)
    entry.entity?.destroy()
    entry.channel.dispose()
  }

  /**
   * Emits a particle into the channel with the given name
   *
   * @param position - position in world space
   * @param velocity - velocity of the emitter. The channel modifies the vector
   */
  public emit(name: string, position: IVec3, velocity: IVec3) {
    this.channels.get(name)?.channel.emit(position, velocity)
  }

  public override update(time: number, dt: number): void {
    for (const entry of this.channels.values()) {
      entry.channel.update(time, dt)
    }
    this.dt = dt
    for (const emitter of this.emitters) {
      this.updateEmitter(emitter)
    }
  }

  public override render(): void {
    for (const entry of this.channels.values()) {
      entry.entity ??= this.createEntity(entry.channel)
      entry.channel.draw()
    }
  }

  private updateEmitter(entity: GameEntity) {
    const emitter = entity.component(ParticleEmitterComponent)
    const transform = entity.component(TransformComponent)
    const dt = this.dt

    const world = transform.world
    position.x = world[12]
    position.y = world[13]
    position.z = world[14]

    if (!emitter.hasLastPosition) {
      vec3$initFrom(emitter.lastPosition, position)
      emitter.hasLastPosition = true
    }

    if (emitter.frequency > 0 && dt > 0) {
      this.emitParticles(emitter, world, dt)
    } else {
      emitter.timeFraction = 0
    }
    vec3$initFrom(emitter.lastPosition, position)
  }

  private emitParticles(emitter: ParticleEmitterComponent, world: ArrayLike<number>, dt: number) {
    const last = emitter.lastPosition
    const step = 1 / emitter.frequency

    // velocity of the emitter plus the local velocity rotated into world space
    const v = emitter.velocity
    const k = emitter.inheritVelocity / dt
    emitVelocity.x = (position.x - last.x) * k + world[0] * v.x + world[4] * v.y + world[8] * v.z
    emitVelocity.y = (position.y - last.y) * k + world[1] * v.x + world[5] * v.y + world[9] * v.z
    emitVelocity.z = (position.z - last.z) * k + world[2] * v.x + world[6] * v.y + world[10] * v.z

    let remaining = emitter.timeFraction + dt
    let elapsed = -emitter.timeFraction
    while (remaining > step) {
      remaining -= step
      elapsed += step
      // position along the path of this update
      const t = elapsed / dt
      const p = vec3.$0
      p.x = last.x + (position.x - last.x) * t
      p.y = last.y + (position.y - last.y) * t
      p.z = last.z + (position.z - last.z) * t
      // the channel modifies the velocity
      vec3$initFrom(velocity, emitVelocity)
      this.emit(emitter.channel, p, velocity)
    }
    emitter.timeFraction = remaining
  }

  private createEntity(channel: ParticleChannel): GameEntity | null {
    const scene = this.options.scene ?? this.world.getSystem(EcsGame, { optional: true })?.scene
    if (!scene) {
      return null
    }
    return this.world.createEntity({
      name: 'Particles',
      parent: scene.entity,
      transform: new TransformComponent(),
      components: [new MeshComponent({ mesh: channel.mesh })],
    })
  }
}
