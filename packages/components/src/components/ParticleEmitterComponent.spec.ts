import { GameEntity, GameWorld } from '@gglib/ecs'
import { IVec3, quatCreateAxisAngle, vec3 } from '@gglib/math'
import { beforeEach, describe, expect, it } from 'vitest'
import { ParticleSystem } from '../systems/ParticleSystem'
import { ParticleEmitterComponent } from './ParticleEmitterComponent'
import { TransformComponent } from './TransformComponent'

/**
 * Records the emitted particles instead of creating GPU channels
 */
class RecordingParticleSystem extends ParticleSystem {
  public emitted: Array<{ channel: string; position: IVec3; velocity: IVec3 }> = []

  public override emit(channel: string, position: IVec3, velocity: IVec3): void {
    this.emitted.push({ channel, position: vec3(position), velocity: vec3(velocity) })
  }
}

describe('ParticleEmitterComponent', () => {
  // the ParticleSystem emits the particles of the emitters in its update
  let world: GameWorld
  let system: RecordingParticleSystem

  beforeEach(() => {
    world = new GameWorld()
    system = new RecordingParticleSystem(null)
    world.addSystem(system, ParticleSystem)
    world.initialize()
  })

  function create(emitter: ParticleEmitterComponent, transform = new TransformComponent()) {
    const entity: GameEntity = world.createEntity({ transform, components: [emitter] })
    entity.initialize()
    entity.activate()
    return entity
  }

  it('emits frequency * time particles and carries the remainder over', () => {
    const emitter = new ParticleEmitterComponent({ channel: 'smoke', frequency: 4 })
    create(emitter)
    system.update(0, 0.375)
    expect(system.emitted.length).toBe(1)
    system.update(0, 0.375)
    expect(system.emitted.length).toBe(2)
    system.update(0, 0.375)
    expect(system.emitted.length).toBe(4)
    expect(system.emitted.every((it) => it.channel === 'smoke')).toBe(true)
  })

  it('emits nothing with zero frequency', () => {
    const emitter = new ParticleEmitterComponent({ channel: 'smoke', frequency: 0 })
    create(emitter)
    system.update(0, 1)
    expect(system.emitted.length).toBe(0)
  })

  it('spreads particles along the path and inherits the emitter velocity', () => {
    const emitter = new ParticleEmitterComponent({ channel: 'wake', frequency: 0 })
    const entity = create(emitter)
    system.update(0, 1)

    entity.component(TransformComponent).setPosition(1, 0, 0)
    emitter.frequency = 4
    system.update(0, 1)

    expect(system.emitted.map((it) => it.position.x)).toEqual([0.25, 0.5, 0.75])
    for (const it of system.emitted) {
      expect(it.velocity.x).toBeCloseTo(1)
      expect(it.velocity.y).toBeCloseTo(0)
      expect(it.velocity.z).toBeCloseTo(0)
    }
  })

  it('emits at the world position of a child and rotates the local velocity', () => {
    const parent = world.createEntity({
      transform: new TransformComponent({ position: vec3(5, 0, 0), rotation: quatCreateAxisAngle(vec3(0, 1, 0), Math.PI / 2) }),
    })
    const emitter = new ParticleEmitterComponent({ channel: 'wake', frequency: 2, velocity: vec3(0, 0, 1) })
    world.createEntity({
      parent,
      transform: new TransformComponent({ position: vec3(0, 0, 1) }),
      components: [emitter],
    })
    parent.initialize()
    parent.activate()

    system.update(0, 1)
    expect(system.emitted.length).toBe(1)
    const { position, velocity } = system.emitted[0]
    // rotating by 90 degrees around y maps +z to +x
    expect(position.x).toBeCloseTo(6)
    expect(position.z).toBeCloseTo(0)
    expect(velocity.x).toBeCloseTo(1)
    expect(velocity.z).toBeCloseTo(0)
  })
})
