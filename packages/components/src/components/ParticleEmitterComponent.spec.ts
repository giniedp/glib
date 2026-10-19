import { GameEntity, GameWorld } from '@gglib/ecs'
import { ParticleChannel } from '@gglib/effects'
import { Device, WebglDevice } from '@gglib/graphics'
import { IVec3, quatCreateAxisAngle, vec3 } from '@gglib/math'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { ParticleSystem } from '../systems/ParticleSystem'
import { SceneSystem } from '../systems/SceneSystem'
import { MeshComponent } from './MeshComponent'
import { ParticleEmitterComponent } from './ParticleEmitterComponent'
import { SceneComponent } from './SceneComponent'
import { TransformComponent } from './TransformComponent'

/**
 * Records the emitted particles
 */
class RecordingParticleSystem extends ParticleSystem {
  public emitted: Array<{ channel: ParticleChannel; position: IVec3; velocity: IVec3 }> = []

  protected override emit(channel: ParticleChannel, position: IVec3, velocity: IVec3): void {
    this.emitted.push({ channel, position: vec3(position), velocity: vec3(velocity) })
  }
}

describe('ParticleEmitterComponent', () => {
  // the ParticleSystem emits the particles of the emitters in its update
  let device: Device
  let world: GameWorld
  let system: RecordingParticleSystem
  let sceneA: GameEntity
  let sceneB: GameEntity

  beforeAll(async () => {
    device = await new WebglDevice({}).ready
  })
  afterAll(() => device.dispose())

  beforeEach(() => {
    world = new GameWorld()
    world.addSystem(new SceneSystem(world))
    system = new RecordingParticleSystem(device)
    system.addChannel('smoke')
    system.addChannel('wake')
    world.addSystem(system, ParticleSystem)
    sceneA = createScene('A')
    sceneB = createScene('B')
    world.initialize()
    sceneA.activate()
    sceneB.activate()
  })

  function createScene(name: string) {
    return world.createEntity({
      name,
      transform: new TransformComponent(),
      components: [new SceneComponent()],
    })
  }

  function create(emitter: ParticleEmitterComponent, transform = new TransformComponent(), parent = sceneA) {
    const entity: GameEntity = world.createEntity({ parent, transform, components: [emitter] })
    // children of an active parent are activated on creation
    if (!parent) {
      entity.initialize()
      entity.activate()
    }
    return entity
  }

  /**
   * Propagates the transforms of the scenes, then updates the particle system
   */
  function step(dt: number) {
    world.getSystem(SceneSystem).update()
    system.update(0, dt)
  }

  function channelEntities(scene: GameEntity) {
    return (scene.children ?? []).map((it) => it.entity).filter((it) => !it.isDestroyed && it.has(MeshComponent))
  }

  it('emits frequency * time particles and carries the remainder over', () => {
    const emitter = new ParticleEmitterComponent({ channel: 'smoke', frequency: 4 })
    create(emitter)
    step(0.375)
    expect(system.emitted.length).toBe(1)
    step(0.375)
    expect(system.emitted.length).toBe(2)
    step(0.375)
    expect(system.emitted.length).toBe(4)
    const channel = system.getChannel('smoke', sceneA.$(SceneComponent))
    expect(system.emitted.every((it) => it.channel === channel)).toBe(true)
  })

  it('emits nothing with zero frequency', () => {
    const emitter = new ParticleEmitterComponent({ channel: 'smoke', frequency: 0 })
    create(emitter)
    step(1)
    expect(system.emitted.length).toBe(0)
  })

  it('emits nothing into unknown channels or outside of a scene', () => {
    create(new ParticleEmitterComponent({ channel: 'unknown', frequency: 4 }))
    create(new ParticleEmitterComponent({ channel: 'smoke', frequency: 4 }), new TransformComponent(), null)
    step(1)
    expect(system.emitted.length).toBe(0)
  })

  it('spreads particles along the path and inherits the emitter velocity', () => {
    const emitter = new ParticleEmitterComponent({ channel: 'wake', frequency: 0 })
    const entity = create(emitter)
    step(1)

    entity.component(TransformComponent).setPosition(1, 0, 0)
    emitter.frequency = 4
    step(1)

    expect(system.emitted.map((it) => it.position.x)).toEqual([0.25, 0.5, 0.75])
    for (const it of system.emitted) {
      expect(it.velocity.x).toBeCloseTo(1)
      expect(it.velocity.y).toBeCloseTo(0)
      expect(it.velocity.z).toBeCloseTo(0)
    }
  })

  it('emits at the world position of a child and rotates the local velocity', () => {
    const parent = world.createEntity({
      parent: sceneA,
      transform: new TransformComponent({ position: vec3(5, 0, 0), rotation: quatCreateAxisAngle(vec3(0, 1, 0), Math.PI / 2) }),
    })
    const emitter = new ParticleEmitterComponent({ channel: 'wake', frequency: 2, velocity: vec3(0, 0, 1) })
    world.createEntity({
      parent,
      transform: new TransformComponent({ position: vec3(0, 0, 1) }),
      components: [emitter],
    })

    step(1)
    expect(system.emitted.length).toBe(1)
    const { position, velocity } = system.emitted[0]
    // rotating by 90 degrees around y maps +z to +x
    expect(position.x).toBeCloseTo(6)
    expect(position.z).toBeCloseTo(0)
    expect(velocity.x).toBeCloseTo(1)
    expect(velocity.z).toBeCloseTo(0)
  })

  it('duplicates channels per scene', () => {
    create(new ParticleEmitterComponent({ channel: 'smoke', frequency: 4 }), new TransformComponent(), sceneB)
    step(1)
    system.render()
    expect(system.getChannel('smoke', sceneA.$(SceneComponent))).toBe(null)
    expect(system.getChannel('smoke', sceneB.$(SceneComponent))).not.toBe(null)
    expect(channelEntities(sceneA).length).toBe(0)
    expect(channelEntities(sceneB).length).toBe(1)

    create(new ParticleEmitterComponent({ channel: 'smoke', frequency: 4 }), new TransformComponent(), sceneA)
    step(1)
    system.render()
    const a = system.getChannel('smoke', sceneA.$(SceneComponent))
    expect(a).not.toBe(null)
    expect(a).not.toBe(system.getChannel('smoke', sceneB.$(SceneComponent)))
    expect(channelEntities(sceneA).length).toBe(1)
  })

  it('removes a channel from all scenes', () => {
    create(new ParticleEmitterComponent({ channel: 'smoke', frequency: 4 }), new TransformComponent(), sceneA)
    create(new ParticleEmitterComponent({ channel: 'smoke', frequency: 4 }), new TransformComponent(), sceneB)
    step(1)
    system.render()
    system.removeChannel('smoke')
    expect(system.getChannel('smoke', sceneA.$(SceneComponent))).toBe(null)
    expect(system.getChannel('smoke', sceneB.$(SceneComponent))).toBe(null)
    expect(channelEntities(sceneA).length).toBe(0)
    expect(channelEntities(sceneB).length).toBe(0)
  })

  it('drops the channels of a destroyed scene', () => {
    const scene = sceneB.$(SceneComponent)
    create(new ParticleEmitterComponent({ channel: 'smoke', frequency: 4 }), new TransformComponent(), sceneB)
    step(1)
    system.render()
    const entity = channelEntities(sceneB)[0]
    sceneB.destroy()
    step(1)
    expect(entity.isDestroyed).toBe(true)
    expect(system.getChannel('smoke', scene)).toBe(null)
  })
})
