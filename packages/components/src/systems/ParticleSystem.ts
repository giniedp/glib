import { GameEntity, GameQuery, GameSystem, GameWorld, GetComponent } from '@gglib/ecs'
import { ParticleChannel, ParticleChannelOptions } from '@gglib/effects'
import { Device } from '@gglib/graphics'
import { IVec3, vec3, vec3$initFrom } from '@gglib/math'
import { removeItemUnordered } from '@gglib/utils'
import { MeshComponent } from '../components/MeshComponent'
import { ParticleEmitterComponent } from '../components/ParticleEmitterComponent'
import { SceneComponent } from '../components/SceneComponent'
import { TransformComponent } from '../components/TransformComponent'

interface ChannelEntry {
  name: string
  channel: ParticleChannel
  entity: GameEntity | null
}

/**
 * The channels of one scene
 */
interface SceneParticleData {
  scene: SceneComponent
  channels: Map<string, ChannelEntry>
  list: ChannelEntry[]
}

/**
 * Attaches the {@link SceneParticleData} of this system to their scene
 */
const dataKey = Symbol('SceneParticleDataKey')

const position = vec3()
const velocity = vec3()
const emitVelocity = vec3()

/**
 * Manages named particle channels and renders them in the scenes of their emitters
 *
 * @public
 * @remarks
 * A channel is added once by name, each scene gets its own {@link ParticleChannel} of it. The channel of a scene is
 * created when the first emitter of that scene emits into it. It is rendered by an entity with a {@link MeshComponent},
 * which is a child of the scene entity. The channel is a transparent mesh, so it needs a transparent pass in
 * the render pipeline.
 *
 * Particles are emitted by entities with a {@link ParticleEmitterComponent}, which the system processes in its update.
 * Emitters outside of a scene or with an unknown channel emit nothing. The particles of an update are uploaded in the
 * render step. Add the system after the systems that move the emitters (e.g. the `BehaviorSystem`), so particles are
 * emitted at the current positions, and before the `Renderer`, so they are uploaded before the scene is drawn.
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
  private definitions = new Map<string, ParticleChannelOptions | undefined>()
  private scenes: SceneParticleData[] = []
  private emitters: GameQuery
  private dt = 0

  public constructor(device: Device) {
    super()
    this.device = device
  }

  public override initialize(world: GameWorld): void {
    this.world = world
    this.emitters = world.query({ scope: 'active', required: [ParticleEmitterComponent, TransformComponent] })
  }

  public override destroy(): void {
    while (this.scenes.length) {
      this.removeSceneData(this.scenes[this.scenes.length - 1])
    }
    this.definitions.clear()
  }

  /**
   * Adds a channel with the given name. The channel is created per scene, when an emitter of the scene emits into it
   *
   * @param options - options of the channel. Resources like textures are shared by the channels of all scenes
   */
  public addChannel(name: string, options?: ParticleChannelOptions) {
    if (this.definitions.has(name)) {
      throw new Error(`Particle channel '${name}' already exists`)
    }
    this.definitions.set(name, options)
  }

  /**
   * Gets the channel with the given name of a scene
   *
   * @returns the channel, or `null` if no emitter of the scene emitted into it yet
   */
  public getChannel(name: string, scene: SceneComponent): ParticleChannel | null {
    const data = scene[dataKey] as SceneParticleData | undefined
    return data?.channels.get(name)?.channel ?? null
  }

  /**
   * Removes the channel with the given name and disposes it in all scenes
   */
  public removeChannel(name: string) {
    if (!this.definitions.delete(name)) {
      return
    }
    for (const data of this.scenes) {
      const entry = data.channels.get(name)
      if (entry) {
        this.removeEntry(data, entry)
      }
    }
  }

  public override update(time: number, dt: number): void {
    const scenes = this.scenes
    for (let i = scenes.length - 1; i >= 0; i--) {
      // the channel entities were destroyed with the scene
      if (scenes[i].scene.entity.isDestroyed) {
        this.removeSceneData(scenes[i])
        continue
      }
      const list = scenes[i].list
      for (let j = 0; j < list.length; j++) {
        list[j].channel.update(time, dt)
      }
    }
    this.dt = dt
    for (const emitter of this.emitters) {
      this.updateEmitter(emitter)
    }
  }

  public override render(): void {
    for (const data of this.scenes) {
      for (const entry of data.list) {
        // created here and not while the emitters are iterated
        entry.entity ??= this.createEntity(data.scene, entry.channel)
        entry.channel.commit()
      }
    }
  }

  private updateEmitter(entity: GameEntity) {
    const emitter = entity.$(ParticleEmitterComponent)
    const transform = entity.$(TransformComponent)
    const dt = this.dt

    const world = transform.world
    position.x = world[12]
    position.y = world[13]
    position.z = world[14]

    if (!emitter.hasLastPosition) {
      vec3$initFrom(emitter.lastPosition, position)
      emitter.hasLastPosition = true
    }

    const channel = emitter.frequency > 0 && dt > 0 ? this.resolveChannel(entity, emitter.channel) : null
    if (channel) {
      this.emitParticles(channel, emitter, world, dt)
    } else {
      emitter.timeFraction = 0
    }
    vec3$initFrom(emitter.lastPosition, position)
  }

  /**
   * Gets the channel of the scene of the entity, creates it if necessary
   */
  private resolveChannel(entity: GameEntity, name: string): ParticleChannel | null {
    const scene = entity.$(SceneComponent.Member, GetComponent.Optional)?.scene
    if (!scene || !this.definitions.has(name)) {
      return null
    }
    const data = this.getSceneData(scene)
    let entry = data.channels.get(name)
    if (!entry) {
      entry = { name, channel: new ParticleChannel(this.device, this.definitions.get(name)), entity: null }
      data.channels.set(name, entry)
      data.list.push(entry)
    }
    return entry.channel
  }

  private emitParticles(
    channel: ParticleChannel,
    emitter: ParticleEmitterComponent,
    world: ArrayLike<number>,
    dt: number,
  ) {
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
      this.emit(channel, p, velocity)
    }
    emitter.timeFraction = remaining
  }

  /**
   * Emits a particle into a channel
   *
   * @param position - position in world space
   * @param velocity - velocity of the emitter. The channel modifies the vector
   */
  protected emit(channel: ParticleChannel, position: IVec3, velocity: IVec3) {
    channel.emit(position, velocity)
  }

  private getSceneData(scene: SceneComponent): SceneParticleData {
    let data = scene[dataKey] as SceneParticleData | undefined
    if (!data) {
      data = { scene, channels: new Map(), list: [] }
      scene[dataKey] = data
      this.scenes.push(data)
    }
    return data
  }

  private removeSceneData(data: SceneParticleData) {
    while (data.list.length) {
      this.removeEntry(data, data.list[data.list.length - 1])
    }
    delete data.scene[dataKey]
    removeItemUnordered(this.scenes, data)
  }

  private removeEntry(data: SceneParticleData, entry: ChannelEntry) {
    data.channels.delete(entry.name)
    removeItemUnordered(data.list, entry)
    entry.entity?.destroy()
    entry.channel.dispose()
  }

  private createEntity(scene: SceneComponent, channel: ParticleChannel): GameEntity {
    return this.world.createEntity({
      name: 'Particles',
      parent: scene.entity,
      transform: new TransformComponent(),
      components: [new MeshComponent({ mesh: channel.mesh })],
    })
  }
}
